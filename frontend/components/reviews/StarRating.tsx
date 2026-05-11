'use client';

type Props = {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASS = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: Props) {
  return (
    <div
      data-testid="star-rating"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${value} de 5 estrellas`}
      className={`inline-flex gap-1 select-none ${SIZE_CLASS[size]}`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
          data-testid={`star-${n}`}
          onClick={() => !readOnly && onChange?.(n)}
          className={`transition-colors ${n <= value ? 'text-yellow-500' : 'text-muted-foreground/40'} ${readOnly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-500'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
