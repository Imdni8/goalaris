import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Mark, highlightMatches } from './mark';

describe('Mark', () => {
  it('renders a <mark> element with primary tokens', () => {
    render(<Mark>hit</Mark>);
    const mark = screen.getByText('hit');
    expect(mark.tagName).toBe('MARK');
    expect(mark.className).toMatch(/text-primary/);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <p>
        The quick <Mark>brown</Mark> fox.
      </p>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('highlightMatches', () => {
  it('returns the text unchanged when query is empty', () => {
    expect(highlightMatches('hello world', '')).toBe('hello world');
  });

  it('wraps case-insensitive matches in <Mark>', () => {
    render(<p>{highlightMatches('Ship the Design system', 'design')}</p>);
    const mark = screen.getByText('Design');
    expect(mark.tagName).toBe('MARK');
  });

  it('returns null for null text', () => {
    expect(highlightMatches(null, 'x')).toBeNull();
  });
});
