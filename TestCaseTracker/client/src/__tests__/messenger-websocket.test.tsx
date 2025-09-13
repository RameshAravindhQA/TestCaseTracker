
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Messenger } from '../components/chat/messenger';
import { useAuth } from '../hooks/use-auth';

// Mock the useAuth hook
vi.mock('../hooks/use-auth');

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock successful send
    const parsedData = JSON.parse(data);
    
    // Simulate server response
    setTimeout(() => {
      if (this.onmessage) {
        if (parsedData.type === 'authenticate') {
          this.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'authenticated',
              userId: parsedData.data.userId,
              onlineUsers: []
            })
          }));
        } else if (parsedData.type === 'send_message') {
          this.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
              type: 'new_message',
              message: {
                id: Date.now(),
                userId: 1,
                userName: 'Test User',
                message: parsedData.message,
                createdAt: new Date().toISOString()
              }
            })
          }));
        }
      }
    }, 50);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

// Mock fetch for API calls
global.fetch = vi.fn();

const mockUser = {
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'Admin'
};

describe('Messenger WebSocket Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    (useAuth as any).mockReturnValue({
      user: mockUser,
      loading: false
    });

    // Mock fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/public')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 2, name: 'Other User', email: 'other@example.com', isOnline: false }
          ])
        });
      }
      if (url.includes('/api/chats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should establish WebSocket connection and authenticate', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Messenger />
      </QueryClientProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    // Check if online badge appears (indicating WebSocket connection)
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should send and receive messages', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Messenger />
      </QueryClientProvider>
    );

    // Wait for component to load and connection to establish
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    // Click on a user to start chat
    const userButton = await screen.findByText('Other User');
    fireEvent.click(userButton);

    // Wait for chat to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    // Type and send a message
    const messageInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(messageInput, { target: { value: 'Hello, test message!' } });
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Verify message appears in chat
    await waitFor(() => {
      expect(screen.getByText('Hello, test message!')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket connection failures gracefully', async () => {
    // Mock WebSocket to fail
    const OriginalWebSocket = global.WebSocket;
    global.WebSocket = vi.fn().mockImplementation(() => {
      throw new Error('Connection failed');
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Messenger />
      </QueryClientProvider>
    );

    // Should show offline mode
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    // Restore original WebSocket
    global.WebSocket = OriginalWebSocket;
  });

  it('should display typing indicators', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Messenger />
      </QueryClientProvider>
    );

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    // Start chat with a user
    const userButton = await screen.findByText('Other User');
    fireEvent.click(userButton);

    // Simulate typing indicator from WebSocket
    const mockWs = MockWebSocket.prototype;
    if (mockWs.onmessage) {
      mockWs.onmessage(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'user_typing',
          userId: 2,
          userName: 'Other User',
          isTyping: true
        })
      }));
    }

    // Check for typing indicator
    await waitFor(() => {
      expect(screen.getByText(/Other User.*typing/)).toBeInTheDocument();
    });
  });

  it('should handle user presence updates', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Messenger />
      </QueryClientProvider>
    );

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    // Simulate presence update from WebSocket
    const mockWs = MockWebSocket.prototype;
    if (mockWs.onmessage) {
      mockWs.onmessage(new MessageEvent('message', {
        data: JSON.stringify({
          type: 'presence_update',
          userId: 2,
          isOnline: true
        })
      }));
    }

    // Check that user's online status is updated
    await waitFor(() => {
      // The green dot indicator should be visible for online users
      const onlineIndicators = document.querySelectorAll('.bg-green-500');
      expect(onlineIndicators.length).toBeGreaterThan(0);
    });
  });
});
