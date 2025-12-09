import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TextInput from '../../src/components/TextInput';

describe('TextInput', () => {
  it('renders an input field', () => {
    render(<TextInput label="Name" value="" onChange={() => undefined} />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeInTheDocument();
  });
});
