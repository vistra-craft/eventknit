import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormQuestion } from '@/lib/form-api';

type AnswerValue = string | string[] | number | null;

interface FormRendererProps {
  questions: FormQuestion[];
  answers: Record<string, AnswerValue>;
  onChange: (answers: Record<string, AnswerValue>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

function StarRating({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function LinearScale({
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
  disabled,
}: {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {steps.map(step => (
          <button
            key={step}
            type="button"
            disabled={disabled}
            onClick={() => onChange(step)}
            className={cn(
              'h-9 w-9 rounded-full border text-sm font-medium transition-colors',
              value === step
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary hover:text-primary',
            )}
          >
            {step}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  error,
  disabled,
}: {
  question: FormQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  error?: string;
  disabled?: boolean;
}) {
  if (question.type === 'section_break') {
    return (
      <div className="pt-2">
        <Separator className="mb-4" />
        {question.label && <h3 className="text-base font-semibold">{question.label}</h3>}
        {question.sectionDescription && (
          <p className="text-sm text-muted-foreground mt-1">{question.sectionDescription}</p>
        )}
      </div>
    );
  }

  const strVal = (value as string) ?? '';
  const arrVal = (value as string[]) ?? [];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {question.label}
        {question.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {question.helpText && (
        <p className="text-xs text-muted-foreground">{question.helpText}</p>
      )}

      {/* Input variants */}
      {['short_text', 'email', 'phone', 'url', 'number'].includes(question.type) && (
        <Input
          type={question.type === 'number' ? 'number' : question.type === 'email' ? 'email' : 'text'}
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={question.placeholder ?? ''}
          disabled={disabled}
          className={cn('h-9 text-sm', error && 'border-destructive')}
        />
      )}

      {question.type === 'long_text' && (
        <Textarea
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={question.placeholder ?? ''}
          disabled={disabled}
          className={cn('min-h-[100px] text-sm resize-none', error && 'border-destructive')}
        />
      )}

      {question.type === 'date' && (
        <Input
          type="date"
          value={strVal}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={cn('h-9 text-sm', error && 'border-destructive')}
        />
      )}

      {question.type === 'single_choice' && (
        <RadioGroup value={strVal} onValueChange={onChange} disabled={disabled}>
          <div className="space-y-2">
            {(question.options ?? []).map(opt => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`${question.id}-${opt.value}`} />
                <Label htmlFor={`${question.id}-${opt.value}`} className="text-sm font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}

      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {(question.options ?? []).map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`${question.id}-${opt.value}`}
                checked={arrVal.includes(opt.value)}
                onCheckedChange={checked => {
                  if (checked) {
                    onChange([...arrVal, opt.value]);
                  } else {
                    onChange(arrVal.filter(v => v !== opt.value));
                  }
                }}
                disabled={disabled}
              />
              <Label htmlFor={`${question.id}-${opt.value}`} className="text-sm font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      )}

      {question.type === 'dropdown' && (
        <Select value={strVal} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={cn('h-9 text-sm', error && 'border-destructive')}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === 'rating' && (
        <StarRating
          value={(value as number) ?? 0}
          max={question.maxValue ?? 5}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {question.type === 'scale' && (
        <LinearScale
          min={question.minValue ?? 1}
          max={question.maxValue ?? 10}
          minLabel={question.minLabel}
          maxLabel={question.maxLabel}
          value={value as number | null}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FormRenderer({ questions, answers, onChange, errors = {}, disabled }: FormRendererProps) {
  const handleChange = (questionId: string, value: AnswerValue) => {
    onChange({ ...answers, [questionId]: value });
  };

  return (
    <div className="space-y-6">
      {questions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(q => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id] ?? null}
            onChange={v => handleChange(q.id, v)}
            error={errors[q.id]}
            disabled={disabled}
          />
        ))}
    </div>
  );
}

/** Validate form answers against question requirements. Returns errors map. */
export function validateFormAnswers(
  questions: FormQuestion[],
  answers: Record<string, AnswerValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    if (q.type === 'section_break') continue;
    if (!q.required) continue;
    const val = answers[q.id];
    if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
      errors[q.id] = 'This field is required';
    }
  }
  return errors;
}
