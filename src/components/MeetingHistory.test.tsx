import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import MeetingHistory from './MeetingHistory';
import { createMockMeeting, mockMeetingsApi } from '../test/utils';
import { Meeting } from '../types';

describe('MeetingHistory Component', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Empty State', () => {
    it('should show empty state when no meetings', () => {
      render(<MeetingHistory meetings={[]} onUpdate={mockOnUpdate} />);
      
      expect(screen.getByText(/No meetings found/i)).toBeInTheDocument();
      expect(screen.getByText(/Record a meeting to get started/i)).toBeInTheDocument();
    });

    it('should show meeting count as 0', () => {
      render(<MeetingHistory meetings={[]} onUpdate={mockOnUpdate} />);
      
      expect(screen.getByText(/0 meetings found/i)).toBeInTheDocument();
    });
  });

  describe('Meeting List', () => {
    it('should display meetings', () => {
      const meetings = [
        createMockMeeting({ title: 'Meeting 1' }),
        createMockMeeting({ title: 'Meeting 2' }),
      ];
      
      render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      expect(screen.getByText('Meeting 1')).toBeInTheDocument();
      expect(screen.getByText('Meeting 2')).toBeInTheDocument();
    });

    it('should show correct meeting count', () => {
      const meetings = [
        createMockMeeting({ title: 'Meeting 1' }),
        createMockMeeting({ title: 'Meeting 2' }),
        createMockMeeting({ title: 'Meeting 3' }),
      ];
      
      render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      expect(screen.getByText(/3 meetings found/i)).toBeInTheDocument();
    });

    it('should show department badges', () => {
      const meetings = [
        createMockMeeting({ title: 'Eng Meeting', department: 'Engineering' }),
        createMockMeeting({ title: 'HR Meeting', department: 'HR' }),
      ];
      
      render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      expect(screen.getAllByText('Engineering').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('HR').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search', () => {
    it('should filter meetings by search query', async () => {
      const meetings = [
        createMockMeeting({ title: 'Sprint Planning' }),
        createMockMeeting({ title: 'Budget Review' }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const searchInput = screen.getByPlaceholderText(/Search meetings/i);
      await user.type(searchInput, 'Sprint');
      
      await waitFor(() => {
        expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
        expect(screen.queryByText('Budget Review')).not.toBeInTheDocument();
      });
    });

    it('should search in transcript content', async () => {
      const meetings = [
        createMockMeeting({ title: 'Meeting A', transcript: 'Discussion about React' }),
        createMockMeeting({ title: 'Meeting B', transcript: 'Discussion about Python' }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const searchInput = screen.getByPlaceholderText(/Search meetings/i);
      await user.type(searchInput, 'React');
      
      await waitFor(() => {
        expect(screen.getByText('Meeting A')).toBeInTheDocument();
        expect(screen.queryByText('Meeting B')).not.toBeInTheDocument();
      });
    });
  });

  describe('Department Filter', () => {
    it('should show all department filter buttons', () => {
      render(<MeetingHistory meetings={[]} onUpdate={mockOnUpdate} />);
      
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Engineering' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sales' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'HR' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Finance' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Operations' })).toBeInTheDocument();
    });

    it('should filter meetings by department', async () => {
      const meetings = [
        createMockMeeting({ title: 'Eng Meeting', department: 'Engineering' }),
        createMockMeeting({ title: 'Sales Meeting', department: 'Sales' }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const engineeringFilter = screen.getByRole('button', { name: 'Engineering' });
      await user.click(engineeringFilter);
      
      await waitFor(() => {
        expect(screen.getByText('Eng Meeting')).toBeInTheDocument();
        expect(screen.queryByText('Sales Meeting')).not.toBeInTheDocument();
      });
    });

    it('should show all meetings when "All" is selected', async () => {
      const meetings = [
        createMockMeeting({ title: 'Eng Meeting', department: 'Engineering' }),
        createMockMeeting({ title: 'Sales Meeting', department: 'Sales' }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      // First filter to Engineering
      await user.click(screen.getByRole('button', { name: 'Engineering' }));
      
      // Then back to All
      await user.click(screen.getByRole('button', { name: 'All' }));
      
      await waitFor(() => {
        expect(screen.getByText('Eng Meeting')).toBeInTheDocument();
        expect(screen.getByText('Sales Meeting')).toBeInTheDocument();
      });
    });
  });

  describe('Meeting Expansion', () => {
    it('should expand meeting to show details', async () => {
      const meetings = [
        createMockMeeting({ 
          title: 'Test Meeting',
          transcript: 'This is the transcript',
          summary: 'This is the summary',
        }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const meetingRow = screen.getByText('Test Meeting').closest('button');
      await user.click(meetingRow!);
      
      await waitFor(() => {
        expect(screen.getByText('This is the transcript')).toBeInTheDocument();
        expect(screen.getByText('This is the summary')).toBeInTheDocument();
      });
    });

    it('should show action items when expanded', async () => {
      const meetings = [
        createMockMeeting({ 
          title: 'Test Meeting',
          actionItems: ['Action 1', 'Action 2'],
        }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const meetingRow = screen.getByText('Test Meeting').closest('button');
      await user.click(meetingRow!);
      
      await waitFor(() => {
        expect(screen.getByText('Action 1')).toBeInTheDocument();
        expect(screen.getByText('Action 2')).toBeInTheDocument();
      });
    });

    it('should collapse meeting when clicked again', async () => {
      const meetings = [
        createMockMeeting({ 
          title: 'Test Meeting',
          transcript: 'This is the transcript',
        }),
      ];
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      const meetingRow = screen.getByText('Test Meeting').closest('button');
      
      // Expand
      await user.click(meetingRow!);
      await waitFor(() => {
        expect(screen.getByText('This is the transcript')).toBeInTheDocument();
      });
      
      // Collapse
      await user.click(meetingRow!);
      await waitFor(() => {
        expect(screen.queryByText('This is the transcript')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Meeting', () => {
    it('should delete meeting when delete button is clicked', async () => {
      window.confirm = vi.fn(() => true);
      const meeting = createMockMeeting({ id: 'mtg_1', title: 'Meeting to Delete' });
      const meetings: Meeting[] = [meeting];
      mockMeetingsApi([meeting]);
      
      const { user } = render(<MeetingHistory meetings={meetings} onUpdate={mockOnUpdate} />);
      
      // Find delete button (trash icon)
      const deleteButton = screen.getByTitle('Delete meeting');
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });
});
