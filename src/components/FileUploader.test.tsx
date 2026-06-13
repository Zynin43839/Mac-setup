import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils';
import FileUploader from './FileUploader';

describe('FileUploader Component', () => {
  const mockOnMeetingCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('should render upload dropzone', () => {
      render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      expect(screen.getByText(/Drop audio file here/i)).toBeInTheDocument();
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
    });

    it('should show supported formats', () => {
      render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      expect(screen.getByText(/Supports:/i)).toBeInTheDocument();
    });

    it('should display current provider status', () => {
      render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      // Default is local provider
      expect(screen.getAllByText(/Local Whisper/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept valid audio files', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
      });
    });

    it('should show error for unsupported file types', async () => {
      render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['text'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText(/Unsupported format/i)).toBeInTheDocument();
      });
    }, 10000);

    it('should show meeting info fields after file selection', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'meeting-audio.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Sprint Planning/i)).toBeInTheDocument();
        expect(screen.getByText(/Departments/i)).toBeInTheDocument();
      });
    });

    it('should auto-fill title from filename', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'Q1-Planning-Meeting.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Sprint Planning/i) as HTMLInputElement;
        expect(titleInput.value).toBe('Q1-Planning-Meeting');
      });
    });
  });

  describe('File Removal', () => {
    it('should allow removing selected file', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText('test.mp3')).toBeInTheDocument();
      });
      
      // Find and click remove button (X button)
      const removeButton = screen.getByRole('button', { name: '' }); // X icon button
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Drop audio file here/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should accept dropped files', async () => {
      render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const dropzone = screen.getByText(/Drop audio file here/i).closest('div') as HTMLElement;
      const file = new File(['audio'], 'dropped.mp3', { type: 'audio/mpeg' });
      
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('dropped.mp3')).toBeInTheDocument();
      });
    });
  });

  describe('Department Selection', () => {
    it('should allow selecting and deselecting departments', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByText(/Departments/i)).toBeInTheDocument();
      });
      
      const salesBtn = screen.getByRole('button', { name: 'Sales' });
      await user.click(salesBtn);
      
      expect(salesBtn.className).toContain('bg-amber-500');
      
      await user.click(salesBtn);
      expect(salesBtn.className).toContain('bg-[#25253e]');
    });
  });

  describe('Process Button', () => {
    it('should show process button when file is selected', async () => {
      const { user } = render(<FileUploader onMeetingCreated={mockOnMeetingCreated} />);
      
      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await user.upload(input, file);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Transcribe/i })).toBeInTheDocument();
      });
    });
  });
});
