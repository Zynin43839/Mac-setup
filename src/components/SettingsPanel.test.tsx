import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import SettingsPanel from './SettingsPanel';
import { loadSettings, setApiKey } from '../store';

describe('SettingsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('should render settings header', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText(/STT Settings/i)).toBeInTheDocument();
    });

    it('should show all provider options', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText(/STT Provider/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Local Whisper/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/OpenAI Whisper API/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Google Speech-to-Text/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/AssemblyAI/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Deepgram/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should have Local Whisper selected by default', () => {
      render(<SettingsPanel />);
      
      const providerButtons = screen.getAllByText(/Local Whisper/i).map(el => el.closest('button'));
      const localOption = providerButtons.find(btn => btn !== null);
      expect(localOption).toHaveClass('border-yellow-400/60');
    });

    it('should show DEFAULT badge on Local Whisper', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText('DEFAULT')).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('should allow selecting different providers', async () => {
      setApiKey('openai', 'sk-test123456789');
      
      const { user } = render(<SettingsPanel />);
      
      const openaiOption = screen.getAllByText(/OpenAI Whisper API/i).map(el => el.closest('button')).find(btn => btn !== null);
      await user.click(openaiOption!);
      
      // Save settings
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      const settings = loadSettings();
      expect(settings.provider).toBe('openai');
    });

    it('should show "Requires API key" for providers without keys', () => {
      render(<SettingsPanel />);
      
      expect(screen.getAllByText(/Requires API key/i).length).toBeGreaterThan(0);
    });

    it('should show "API key configured" when key is set', () => {
      setApiKey('openai', 'sk-test123456789');
      
      render(<SettingsPanel />);
      
      expect(screen.getByText(/API key configured/i)).toBeInTheDocument();
    });
  });

  describe('Local Whisper Settings', () => {
    it('should show model selection when Local Whisper is selected', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText(/Model Size/i)).toBeInTheDocument();
      expect(screen.getByText(/Language/i)).toBeInTheDocument();
    });

    it('should allow changing model size', async () => {
      const { user } = render(<SettingsPanel />);
      
      const selects = screen.getAllByRole('combobox');
      const modelSelect = selects[0];
      await user.selectOptions(modelSelect, 'small');
      
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      const settings = loadSettings();
      expect(settings.localWhisper.model).toBe('small');
    });

    it('should allow changing language', async () => {
      const { user } = render(<SettingsPanel />);
      
      const selects = screen.getAllByRole('combobox');
      const languageSelect = selects[1]; // Second select is language
      
      await user.selectOptions(languageSelect, 'en');
      
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      const settings = loadSettings();
      expect(settings.localWhisper.language).toBe('en');
    });
  });

  describe('API Key Input', () => {
    it('should show Claude API key input with RECOMMENDED badge', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/sk-ant-api03/i)).toBeInTheDocument();
    });

    it('should save API key when entered', async () => {
      const { user } = render(<SettingsPanel />);
      
      const claudeInput = screen.getByPlaceholderText(/sk-ant-api03/i);
      await user.type(claudeInput, 'sk-ant-api03-test-key');
      
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      const settings = loadSettings();
      expect(settings.apiKeys.claude).toBe('sk-ant-api03-test-key');
    });

    it('should toggle password visibility', async () => {
      const { user } = render(<SettingsPanel />);
      
      const claudeInput = screen.getByPlaceholderText(/sk-ant-api03/i) as HTMLInputElement;
      expect(claudeInput.type).toBe('password');
      
      const toggleButton = claudeInput.parentElement?.querySelector('button') || 
        screen.getAllByRole('button').filter(btn => 
          btn.querySelector('.lucide-eye') || btn.querySelector('.lucide-eye-off')
        )[0];
      await user.click(toggleButton!);
      
      expect(claudeInput.type).toBe('text');
    });

    it('should show links to get API keys', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText(/console.anthropic.com/i)).toBeInTheDocument();
      expect(screen.getByText(/platform.openai.com/i)).toBeInTheDocument();
    });
  });

  describe('Summarization Toggle', () => {
    it('should show summarization toggle', () => {
      render(<SettingsPanel />);
      
      expect(screen.getByText(/Auto-summarize transcripts/i)).toBeInTheDocument();
    });

    it('should toggle summarization setting', async () => {
      const { user } = render(<SettingsPanel />);
      
      // Find the toggle that's for summarization
      const toggles = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('rounded-full') && btn.classList.contains('w-12')
      );
      
      if (toggles.length > 0) {
        await user.click(toggles[0]);
        
        const saveButton = screen.getByText(/Save Settings/i);
        await user.click(saveButton);
        
        const settings = loadSettings();
        expect(settings.summarization.enabled).toBe(false);
      }
    });
  });

  describe('Save Settings', () => {
    it('should show success message when settings are saved', async () => {
      const { user } = render(<SettingsPanel />);
      
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Settings Saved/i)).toBeInTheDocument();
      });
    });

    it('should call onSettingsChange callback when provided', async () => {
      const onSettingsChange = vi.fn();
      const { user } = render(<SettingsPanel onSettingsChange={onSettingsChange} />);
      
      const saveButton = screen.getByText(/Save Settings/i);
      await user.click(saveButton);
      
      expect(onSettingsChange).toHaveBeenCalled();
    });
  });
});
