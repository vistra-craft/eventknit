import { useState, useCallback } from 'react';
import { Plus, GripVertical, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FormQuestion, FormQuestionType } from '@/lib/form-api';

const QUESTION_TYPES: { value: FormQuestionType; label: string; group: string }[] = [
  { value: 'short_text', label: 'Short Text', group: 'Text' },
  { value: 'long_text', label: 'Long Text', group: 'Text' },
  { value: 'email', label: 'Email', group: 'Text' },
  { value: 'phone', label: 'Phone', group: 'Text' },
  { value: 'number', label: 'Number', group: 'Text' },
  { value: 'url', label: 'URL / Link', group: 'Text' },
  { value: 'date', label: 'Date', group: 'Other' },
  { value: 'single_choice', label: 'Single Choice', group: 'Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice', group: 'Choice' },
  { value: 'dropdown', label: 'Dropdown', group: 'Choice' },
  { value: 'rating', label: 'Rating (Stars)', group: 'Scale' },
  { value: 'scale', label: 'Linear Scale', group: 'Scale' },
  { value: 'file_upload', label: 'File Upload', group: 'Other' },
  { value: 'section_break', label: 'Section Break', group: 'Layout' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeQuestion(type: FormQuestionType, order: number): FormQuestion {
  const base: FormQuestion = { id: generateId(), type, label: '', required: false, order };
  if (['single_choice', 'multiple_choice', 'dropdown'].includes(type)) {
    base.options = [{ value: 'option_1', label: 'Option 1' }];
  }
  if (type === 'rating') { base.minValue = 1; base.maxValue = 5; }
  if (type === 'scale') { base.minValue = 1; base.maxValue = 10; base.minLabel = ''; base.maxLabel = ''; }
  return base;
}

interface QuestionCardProps {
  question: FormQuestion;
  index: number;
  onChange: (updated: FormQuestion) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function QuestionCard({
  question,
  index,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<FormQuestion>) => onChange({ ...question, ...patch });

  const addOption = () => {
    const opts = question.options ?? [];
    const n = opts.length + 1;
    update({ options: [...opts, { value: `option_${n}`, label: `Option ${n}` }] });
  };

  const updateOption = (i: number, label: string) => {
    const opts = [...(question.options ?? [])];
    opts[i] = { value: opts[i].value, label };
    update({ options: opts });
  };

  const removeOption = (i: number) => {
    const opts = [...(question.options ?? [])];
    opts.splice(i, 1);
    update({ options: opts });
  };

  const isSectionBreak = question.type === 'section_break';
  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(question.type);
  const hasScale = ['rating', 'scale'].includes(question.type);

  return (
    <div className="border border-border/50 rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
        <span className="text-xs font-medium text-muted-foreground w-5">{index + 1}</span>
        <span className="flex-1 text-sm font-medium truncate">
          {question.label || (isSectionBreak ? 'Section Break' : 'Untitled question')}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Question label */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">{isSectionBreak ? 'Section Title' : 'Question Label'}</Label>
              <Input
                value={question.label}
                onChange={e => update({ label: e.target.value })}
                placeholder={isSectionBreak ? 'Section title...' : 'Enter question...'}
                className="h-8 text-sm"
              />
            </div>

            {/* Type selector */}
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">Question Type</Label>
              <Select
                value={question.type}
                onValueChange={type => onChange(makeQuestion(type as FormQuestionType, question.order)
                  ? { ...makeQuestion(type as FormQuestionType, question.order), id: question.id, label: question.label }
                  : question
                )}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(qt => (
                    <SelectItem key={qt.value} value={qt.value} className="text-sm">
                      {qt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Help text / placeholder */}
          {!isSectionBreak && (
            <div className="space-y-1">
              <Label className="text-xs">Help Text (optional)</Label>
              <Input
                value={question.helpText ?? ''}
                onChange={e => update({ helpText: e.target.value })}
                placeholder="Additional instructions for this question..."
                className="h-8 text-sm"
              />
            </div>
          )}

          {/* Section description */}
          {isSectionBreak && (
            <div className="space-y-1">
              <Label className="text-xs">Section Description (optional)</Label>
              <Textarea
                value={question.sectionDescription ?? ''}
                onChange={e => update({ sectionDescription: e.target.value })}
                placeholder="Describe this section..."
                className="text-sm min-h-[60px]"
              />
            </div>
          )}

          {/* Choice options */}
          {hasOptions && (
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              {(question.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground shrink-0"
                    onClick={() => removeOption(i)}
                    disabled={(question.options?.length ?? 0) <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addOption}>
                <Plus className="h-3 w-3 mr-1" />
                Add option
              </Button>
            </div>
          )}

          {/* Scale config */}
          {hasScale && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min value</Label>
                <Input
                  type="number"
                  value={question.minValue ?? 1}
                  onChange={e => update({ minValue: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max value</Label>
                <Input
                  type="number"
                  value={question.maxValue ?? 5}
                  onChange={e => update({ maxValue: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
              {question.type === 'scale' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Min label</Label>
                    <Input
                      value={question.minLabel ?? ''}
                      onChange={e => update({ minLabel: e.target.value })}
                      placeholder="e.g. Not at all"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max label</Label>
                    <Input
                      value={question.maxLabel ?? ''}
                      onChange={e => update({ maxLabel: e.target.value })}
                      placeholder="e.g. Extremely"
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Required toggle */}
          {!isSectionBreak && (
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={checked => update({ required: checked })}
              />
              <Label htmlFor={`required-${question.id}`} className="text-xs cursor-pointer">
                Required
              </Label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FormBuilderProps {
  questions: FormQuestion[];
  onChange: (questions: FormQuestion[]) => void;
  className?: string;
}

export function FormBuilder({ questions, onChange, className }: FormBuilderProps) {
  const addQuestion = useCallback((type: FormQuestionType) => {
    const newQ = makeQuestion(type, questions.length);
    onChange([...questions, newQ]);
  }, [questions, onChange]);

  const updateQuestion = useCallback((index: number, updated: FormQuestion) => {
    const next = [...questions];
    next[index] = updated;
    onChange(next);
  }, [questions, onChange]);

  const deleteQuestion = useCallback((index: number) => {
    const next = questions.filter((_, i) => i !== index);
    onChange(next.map((q, i) => ({ ...q, order: i })));
  }, [questions, onChange]);

  const duplicateQuestion = useCallback((index: number) => {
    const q = { ...questions[index], id: generateId(), order: index + 1 };
    const next = [...questions.slice(0, index + 1), q, ...questions.slice(index + 1)];
    onChange(next.map((q2, i) => ({ ...q2, order: i })));
  }, [questions, onChange]);

  const moveQuestion = useCallback((index: number, direction: 'up' | 'down') => {
    const next = [...questions];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((q, i) => ({ ...q, order: i })));
  }, [questions, onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {questions.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No questions yet. Add your first question below.
        </div>
      )}

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          onChange={updated => updateQuestion(i, updated)}
          onDelete={() => deleteQuestion(i)}
          onDuplicate={() => duplicateQuestion(i)}
          onMoveUp={() => moveQuestion(i, 'up')}
          onMoveDown={() => moveQuestion(i, 'down')}
          isFirst={i === 0}
          isLast={i === questions.length - 1}
        />
      ))}

      {/* Add question toolbar */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => addQuestion('short_text')}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Short Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('long_text')}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Long Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('single_choice')}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Single Choice
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('multiple_choice')}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Multiple Choice
        </Button>
        <Select onValueChange={v => addQuestion(v as FormQuestionType)}>
          <SelectTrigger className="h-8 w-auto gap-1 text-sm border-dashed">
            <Plus className="h-3.5 w-3.5" />
            More
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.filter(qt => !['short_text', 'long_text', 'single_choice', 'multiple_choice'].includes(qt.value)).map(qt => (
              <SelectItem key={qt.value} value={qt.value} className="text-sm">
                {qt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
