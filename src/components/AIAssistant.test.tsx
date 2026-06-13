import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import AIAssistant from './AIAssistant';
import { setApiKey } from '../store';
import { createMockMeeting, mockMeetingsApi } from '../test/utils';

describe('AIAssistant Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('should render header', () => {
      mockMeetingsApi([]);
      render(<AIAssistant />);
      
      expect(screen.getByText(/AI Meeting Assistant/i)).toBeInTheDocument();
    });

    it('should show API key input when no key is set', () => {
      mockMeetingsApi([]);
      render(<AIAssistant />);
      
      expect(screen.getByText(/Claude API Key Required/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/sk-ant-api03/i)).toBeInTheDocument();
    });

    it('should show meeting selector', () => {
      mockMeetingsApi([]);
      render(<AIAssistant />);
      
      expect(screen.getByText(/Select a meeting to analyze/i)).toBeInTheDocument();
    });

    it('should show empty state when no meetings', () => {
      mockMeetingsApi([]);
      render(<AIAssistant />);
      
      expect(screen.getAllByText(/Select a Meeting/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('API Key Handling', () => {
    it('should save valid API key', async () => {
      mockMeetingsApi([]);
      const { user } = render(<AIAssistant />);
      
      const input = screen.getByPlaceholderText(/sk-ant-api03/i);
      await user.type(input, 'sk-ant-api03-test-key');
      
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Claude API connected/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid API key format', async () => {
      localStorage.clear();
      mockMeetingsApi([]);
      const { user } = render(<AIAssistant />);
      
      const input = await screen.findByPlaceholderText(/sk-ant-api03/i);
      await user.type(input, 'invalid-key');
      
      const saveButton = screen.getByRole('button', { name: /Save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid API key format/i)).toBeInTheDocument();
      });
    });

    it('should hide key input when valid key exists', () => {
      mockMeetingsApi([]);
      setApiKey('claude', 'sk-ant-api03-valid-key');
      
      render(<AIAssistant />);
      
      expect(screen.queryByText(/Claude API Key Required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Claude API connected/i)).toBeInTheDocument();
    });

    it('should allow changing key', async () => {
      mockMeetingsApi([]);
      setApiKey('claude', 'sk-ant-api03-old-key');
      
      const { user } = render(<AIAssistant />);
      
      const changeButton = screen.getByText(/Change key/i);
      await user.click(changeButton);
      
      expect(screen.getByPlaceholderText(/sk-ant-api03/i)).toBeInTheDocument();
    });
  });

  describe('Meeting Selection', () => {
    it('should display available meetings in dropdown', async () => {
      const meeting = createMockMeeting({ title: 'Sprint Planning Q1' });
      mockMeetingsApi([meeting]);
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText('Sprint Planning Q1')).toBeInTheDocument();
      });
    });

    it('should show meeting details when selected', async () => {
      const meeting = createMockMeeting({ 
        title: 'Engineering Standup',
        department: 'Engineering' 
      });
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Engineering Standup');
      await user.click(meetingButton);
      
      await waitFor(() => {
        expect(screen.getByText('Engineering Standup')).toBeInTheDocument();
        expect(screen.queryAllByText(/Engineering/i).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show "No meetings found" when list is empty', async () => {
      mockMeetingsApi([]);
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText(/No meetings found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('should show quick action buttons when meeting is selected', async () => {
      const meeting = createMockMeeting();
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Test Meeting');
      await user.click(meetingButton);
      
      // Wait for auto-analysis to complete (it sends message automatically)
      await waitFor(() => {
        // Quick actions should be visible (or chat started)
        const chatOrActions = screen.queryByText(/สรุปการประชุม/i) || 
                             screen.queryByText(/กำลังคิด/i);
        expect(chatOrActions).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('Chat Interface', () => {
    it('should disable input when no meeting selected', () => {
      mockMeetingsApi([]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      render(<AIAssistant />);
      
      const input = screen.getByPlaceholderText(/Select a meeting first/i);
      expect(input).toBeDisabled();
    });

    it('should enable input when meeting is selected', async () => {
      const meeting = createMockMeeting();
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Test Meeting');
      await user.click(meetingButton);
      
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/ถามอะไรก็ได้/i);
        expect(input).not.toBeDisabled();
      }, { timeout: 5000 });
    });

    it('should show loading state when sending message', async () => {
      const meeting = createMockMeeting();
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Test Meeting');
      await user.click(meetingButton);
      
      // Should show loading immediately after selecting
      await waitFor(() => {
        expect(screen.getByText(/กำลังคิด/i)).toBeInTheDocument();
      });
    });

    it('should display AI response after sending message', async () => {
      const meeting = createMockMeeting();
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Test Meeting');
      await user.click(meetingButton);
      
      // Wait for the response from mock API
      await waitFor(() => {
        expect(screen.getByText(/สรุปการประชุม/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Clear Chat', () => {
    it('should clear chat when button is clicked', async () => {
      const meeting = createMockMeeting();
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<AIAssistant />);
      
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      const meetingButton = await screen.findByText('Test Meeting');
      await user.click(meetingButton);
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/Clear chat/i)).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const clearButton = screen.getByText(/Clear chat/i);
      await user.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getAllByText(/Select a Meeting/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
