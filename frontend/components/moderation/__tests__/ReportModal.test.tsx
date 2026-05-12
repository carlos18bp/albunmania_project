/// <reference types="jest" />
import { describe, it, expect, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/lib/stores/reportStore', () => {
  const actual = jest.requireActual('@/lib/stores/reportStore') as object;
  return { ...actual, useReportStore: jest.fn() };
});

import { useReportStore } from '@/lib/stores/reportStore';
import ReportModal from '../ReportModal';

const mockUseReportStore = useReportStore as unknown as jest.Mock;
let submitReport: jest.Mock;

beforeEach(() => {
  submitReport = jest.fn().mockResolvedValue({ id: 1 });
  mockUseReportStore.mockImplementation((selector: (s: { submitReport: jest.Mock }) => unknown) => selector({ submitReport }));
});

describe('ReportModal', () => {
  it('renders the dialog with a reason select and a detail textarea', () => {
    render(<ReportModal targetKind="user" targetId={11} targetLabel="a este coleccionista" onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Reportar' })).toBeInTheDocument();
    expect(screen.getByText('Reportar a este coleccionista')).toBeInTheDocument();
    expect(screen.getByTestId('report-reason')).toBeInTheDocument();
    expect(screen.getByTestId('report-detail')).toBeInTheDocument();
  });

  it('defaults the reason to no_show for trade reports', () => {
    render(<ReportModal targetKind="trade" targetId={3} targetLabel="este intercambio" onClose={jest.fn()} />);
    expect(screen.getByTestId('report-reason')).toHaveValue('no_show');
  });

  it('submits the report with the selected reason + detail', async () => {
    render(<ReportModal targetKind="user" targetId={11} targetLabel="a este coleccionista" onClose={jest.fn()} />);
    fireEvent.change(screen.getByTestId('report-reason'), { target: { value: 'harassment' } });
    fireEvent.change(screen.getByTestId('report-detail'), { target: { value: 'mensajes agresivos' } });
    fireEvent.click(screen.getByTestId('report-submit'));

    await waitFor(() => expect(submitReport).toHaveBeenCalledWith('user', 11, 'harassment', 'mensajes agresivos'));
    expect(screen.getByTestId('report-submitted')).toBeInTheDocument();
  });

  it('omits the detail arg when the textarea is empty', async () => {
    render(<ReportModal targetKind="user" targetId={11} targetLabel="a este coleccionista" onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId('report-submit'));
    await waitFor(() => expect(submitReport).toHaveBeenCalledWith('user', 11, 'fake_profile', undefined));
  });

  it('shows an error message when the submit fails', async () => {
    submitReport.mockRejectedValueOnce(new Error('boom'));
    render(<ReportModal targetKind="user" targetId={11} targetLabel="a este coleccionista" onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId('report-submit'));
    await waitFor(() => expect(screen.getByTestId('report-error')).toBeInTheDocument());
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<ReportModal targetKind="user" targetId={11} targetLabel="a este coleccionista" onClose={onClose} />);
    fireEvent.click(screen.getByTestId('report-modal'));
    expect(onClose).toHaveBeenCalled();
  });
});
