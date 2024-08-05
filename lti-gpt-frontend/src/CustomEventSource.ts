//class to deal with streamed messages from comletions api

export class CustomEventSource { //created by ChatGPT
    private url: string;
    private options: RequestInit;
    ///private eventSource: EventSource | null = null;
    private readonly eventListeners: { [eventName: string]: ((event: MessageEvent) => void)[] } = {};

    constructor(url: string, options: RequestInit = {}) {
        this.url = url;
        this.options = options;
        this.setup();
    }

    private async setup() {
        try {
            const response = await fetch(this.url, this.options);

            if (!response.ok || !response.body) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            // eslint-disable-next-line         
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n\n');

                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        const event = new MessageEvent('message', { data });
                        this.dispatchEvent(event);
                    }
                }
            }

            if (buffer.startsWith('data: ')) {
                const data = buffer.substring(6);
                const event = new MessageEvent('message', { data });
                this.dispatchEvent(event);
            }

        } catch (error) {
            this.dispatchEvent(new MessageEvent('error', { data: error }));
        }
    }

    private dispatchEvent(event: MessageEvent) {
        const listeners = this.eventListeners[event.type];
        if (listeners) {
            listeners.forEach(listener => listener(event));
        }
    }

    addEventListener(type: string, listener: (event: MessageEvent) => void) {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }
        this.eventListeners[type].push(listener);
    }

    removeEventListener(type: string, listener: (event: MessageEvent) => void) {
        const listeners = this.eventListeners[type];
        if (listeners) {
            this.eventListeners[type] = listeners.filter(l => l !== listener);
        }
    }

    close() {
        // Not needed for fetch API, but we can implement some cleanup if required.
    }
}