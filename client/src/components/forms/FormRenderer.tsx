import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { Loader } from '@/components/ui/loader';
import { Star, Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormQuestion } from '@/lib/form-api';

type AnswerValue = string | string[] | number | null;

interface FormRendererProps {
  questions: FormQuestion[];
  answers: Record<string, AnswerValue>;
  onChange: (answers: Record<string, AnswerValue>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  /**
   * Called when a file is dropped on a file_upload question.
   * Should return the uploaded file URL, or null on failure.
   * If omitted, file_upload questions render in a disabled/placeholder state.
   */
  onUpload?: (file: File) => Promise<string | null>;
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

function FileUploadQuestion({
  question,
  value,
  onChange,
  onUpload,
  disabled,
}: {
  question: FormQuestion;
  value: string;
  onChange: (v: string) => void;
  onUpload?: (file: File) => Promise<string | null>;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const accept = (question.acceptedFileTypes ?? ['image/jpeg', 'image/png', 'image/webp']).reduce(
    (acc, mime) => { acc[mime] = []; return acc; },
    {} as Record<string, string[]>,
  );
  const maxSize = (question.maxFileSizeMb ?? 5) * 1024 * 1024;

  const handleFile = async (file: File) => {
    if (!onUpload) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await onUpload(file);
      if (url) onChange(url);
      else setUploadError('Upload failed. Please try again.');
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    maxSize,
    disabled: !onUpload || uploading || disabled,
    onDropAccepted: ([file]) => handleFile(file),
    onDropRejected: ([rejection]) => {
      const code = rejection.errors[0]?.code;
      if (code === 'file-too-large') setUploadError(`File too large. Max ${question.maxFileSizeMb ?? 5} MB.`);
      else if (code === 'file-invalid-type') setUploadError('File type not accepted.');
      else setUploadError('File rejected.');
    },
    noClick: !!value,
  });

  const typeHint = question.acceptedFileTypes
    ? question.acceptedFileTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')
    : 'JPG, PNG, WEBP';

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
        <div className="h-12 w-12 rounded-md overflow-hidden border bg-background flex-shrink-0">
          <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{value.split('/').pop()}</p>
          <div {...getRootProps()} className="inline">
            <input {...getInputProps()} />
            <button
              type="button"
              disabled={disabled || uploading}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              Change
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { onChange(''); setUploadError(null); }}
          disabled={disabled}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    );
  }

  if (!onUpload) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center opacity-50">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">File upload not available here.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader size="sm" className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : isDragActive ? (
          <>
            <Upload className="h-5 w-5" />
            <p className="text-sm font-medium">Drop file here</p>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or <span className="text-primary font-medium">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {typeHint} · Max {question.maxFileSizeMb ?? 5} MB
            </p>
          </>
        )}
      </div>
      {uploadError && <p className="text-xs text-destructive mt-1.5">{uploadError}</p>}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
  error,
  disabled,
  onUpload,
}: {
  question: FormQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  error?: string;
  disabled?: boolean;
  onUpload?: (file: File) => Promise<string | null>;
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

      {question.type === 'file_upload' && (
        <FileUploadQuestion
          question={question}
          value={strVal}
          onChange={v => onChange(v)}
          onUpload={onUpload}
          disabled={disabled}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FormRenderer({ questions, answers, onChange, errors = {}, disabled, onUpload }: FormRendererProps) {
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
            onUpload={onUpload}
          />
        ))}
    </div>
  );
}

