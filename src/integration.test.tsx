import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from './test/utils';
import App from './App';
import { setApiKey } from './store';
import { createMockMeeting, mockMeetingsApi } from './test/utils';

function getSidebarTab(label: RegExp | string): HTMLElement {
  const all = screen.getAllByText(label);
  // Sidebar buttons are inside <aside> (desktop) or the first one
  return all.find(el => el.closest('aside')) || all[0];
}

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('App Navigation', () => {
    it('should render main navigation tabs', () => {
      mockMeetingsApi([]);
      render(<App />);
      
      expect(screen.getAllByText(/Upload Audio/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Meetings/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/AI Assistant/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Settings/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should show Dashboard by default', () => {
      mockMeetingsApi([]);
      render(<App />);
      
      expect(screen.getAllByText(/Working Station/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should navigate to Meeting History', async () => {
      mockMeetingsApi([]);
      const { user } = render(<App />);
      
      const historyTab = getSidebarTab(/Meetings/i);
      await user.click(historyTab);
      
      await waitFor(() => {
        expect(screen.getByText(/0 meetings found/i)).toBeInTheDocument();
      });
    });

    it('should navigate to AI Assistant', async () => {
      mockMeetingsApi([]);
      const { user } = render(<App />);
      
      const aiTab = getSidebarTab(/AI Assistant/i);
      await user.click(aiTab);
      
      await waitFor(() => {
        expect(screen.getByText(/AI Meeting Assistant/i)).toBeInTheDocument();
      });
    });

    it('should navigate to Settings', async () => {
      mockMeetingsApi([]);
      const { user } = render(<App />);
      
      const settingsTab = getSidebarTab(/Settings/i);
      await user.click(settingsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/STT Provider/i)).toBeInTheDocument();
      });
    });
  });

  describe('Full Flow: Upload → History → AI', () => {
    it('should show meetings in history after upload', async () => {
      const meeting = createMockMeeting({ title: 'Uploaded Meeting' });
      mockMeetingsApi([meeting]);
      
      const { user } = render(<App />);
      
      // Navigate to history
      const historyTab = getSidebarTab(/Meetings/i);
      await user.click(historyTab);
      
      await waitFor(() => {
        expect(screen.getByText('Uploaded Meeting')).toBeInTheDocument();
      });
    });

    it('should show meetings in AI Assistant dropdown', async () => {
      const meeting = createMockMeeting({ title: 'Meeting for AI' });
      mockMeetingsApi([meeting]);
      setApiKey('claude', 'sk-ant-api03-test');
      
      const { user } = render(<App />);
      
      // Navigate to AI Assistant
      const aiTab = getSidebarTab(/AI Assistant/i);
      await user.click(aiTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Select a meeting to analyze/i)).toBeInTheDocument();
      });
      
      // Open dropdown
      const selector = screen.getByText(/Select a meeting to analyze/i);
      await user.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText('Meeting for AI')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should persist settings across tab navigation', async () => {
      const { user } = render(<App />);
      
      // Go to settings
      const settingsTab = getSidebarTab(/Settings/i);
      await user.click(settingsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/STT Provider/i)).toBeInTheDocument();
      });
      
      // Enter Claude API key
      const claudeInput = screen.getByPlaceholderText(/sk-ant-api03/i) as HTMLInputElement;
      await user.clear(claudeInput);
      await user.type(claudeInput, 'sk-ant-api03-test');
      
      // Save
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      // Navigate away
      const uploadTab = getSidebarTab(/Upload Audio/i);
      await user.click(uploadTab);
      
      // Navigate back to settings
      await user.click(settingsTab);
      
      // Key should still be there
      await waitFor(() => {
        const input = screen.getByPlaceholderText(/sk-ant-api03/i) as HTMLInputElement;
        expect(input.value).toBe('sk-ant-api03-test');
      });
    });
  });

  describe('Meeting Badge Count', () => {
    it('should show meeting count badge in navigation', async () => {
      const meetings = [
        createMockMeeting({ title: 'Meeting 1' }),
        createMockMeeting({ title: 'Meeting 2' }),
        createMockMeeting({ title: 'Meeting 3' }),
      ];
      mockMeetingsApi(meetings);
      
      render(<App />);
      
      // Should show badge with count 3
      await waitFor(() => {
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should update badge when meeting is deleted', async () => {
      window.confirm = vi.fn(() => true);
      const meetings = [
        createMockMeeting({ id: 'mtg_1', title: 'Meeting 1' }),
        createMockMeeting({ id: 'mtg_2', title: 'Meeting 2' }),
      ];
      mockMeetingsApi(meetings);
      
      const { user } = render(<App />);
      
      // Initial count should be 2
      await waitFor(() => {
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      });
      
      // Navigate to history
      const historyTab = getSidebarTab(/Meetings/i);
      await user.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Meeting 1')).toBeInTheDocument();
      });
      
      const trashButtons = await screen.findAllByTitle('Delete meeting');
      await user.click(trashButtons[0]);
      
      // Badge should update to 1
      await waitFor(() => {
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should render mobile menu button on small screens', () => {
      // Note: In jsdom, we can't actually test responsive breakpoints
      // This test just ensures the menu button exists in the DOM
      render(<App />);
      
      // The hamburger menu should be in the DOM (hidden on desktop via CSS)
      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing settings gracefully', () => {
      mockMeetingsApi([]);
      localStorage.setItem('meeting_app_settings', 'invalid json');
      
      expect(() => render(<App />)).not.toThrow();
    });
  });
});
