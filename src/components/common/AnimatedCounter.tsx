import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  formatIndian?: boolean;
  highlightOnChange?: boolean;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface SingleDigitProps {
  digit: number;
}

const SingleDigitRoll: React.FC<SingleDigitProps> = ({ digit }) => {
  return (
    <span
      className="odometer-digit-box"
      style={{
        display: 'inline-block',
        position: 'relative',
        overflow: 'hidden',
        height: '1.25em',
        lineHeight: '1.25em',
        width: '0.62em',
        textAlign: 'center',
        verticalAlign: 'baseline',
        fontVariantNumeric: 'tabular-nums'
      }}
    >
      <span
        className="odometer-digit-strip"
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(-${digit * 10}%)`,
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1.15)',
          willChange: 'transform'
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            style={{
              height: '1.25em',
              lineHeight: '1.25em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix,
  suffix,
  className = '',
  style = {},
  formatIndian = true,
  highlightOnChange = true
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValRef = useRef(value);

  // Format value into string
  let displayStr = '';
  if (typeof value === 'number') {
    if (isNaN(value)) {
      displayStr = '0';
    } else if (formatIndian) {
      // Indian number formatting (e.g. 1,25,000)
      displayStr = value.toLocaleString('en-IN');
    } else {
      displayStr = value.toLocaleString('en-US');
    }
  } else {
    displayStr = String(value ?? '');
  }

  // Trigger YouTube-style luminous pulse on value change
  useEffect(() => {
    if (prevValRef.current !== value) {
      prevValRef.current = value;
      if (highlightOnChange) {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [value, highlightOnChange]);

  const chars = displayStr.split('');
  const totalChars = chars.length;

  return (
    <span
      className={`animated-counter-root ${className} ${isPulsing ? 'counter-pulsing' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'baseline',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        transition: 'all 0.25s ease',
        filter: isPulsing ? 'brightness(1.2)' : 'none',
        ...style
      }}
    >
      {prefix && <span style={{ marginRight: '2px', display: 'inline-flex' }}>{prefix}</span>}

      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {chars.map((char, index) => {
          const posFromRight = totalChars - 1 - index;
          if (/\d/.test(char)) {
            const digit = parseInt(char, 10);
            return (
              <SingleDigitRoll
                key={`digit-pos-${posFromRight}`}
                digit={digit}
              />
            );
          }
          return (
            <span
              key={`char-${char}-${posFromRight}`}
              style={{
                display: 'inline-block',
                width: char === ' ' ? '0.3em' : char === ',' || char === '.' ? '0.35em' : 'auto',
                textAlign: 'center',
                lineHeight: '1.25em',
                userSelect: 'none'
              }}
            >
              {char}
            </span>
          );
        })}
      </span>

      {suffix && <span style={{ marginLeft: '2px', display: 'inline-flex' }}>{suffix}</span>}
    </span>
  );
};

export default AnimatedCounter;
