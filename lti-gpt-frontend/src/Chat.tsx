import React, { useState, useEffect } from 'react';

import { Alert } from '@instructure/ui-alerts';
import { Button } from '@instructure/ui-buttons';
import { ScreenReaderContent } from '@instructure/ui-a11y-content';
import { TextInput } from '@instructure/ui-text-input';

function Chat() {
    const [message, setMessage] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [contextTitle, setContextTitle] = useState<string>('');
    const [errors, setErrors] = useState<string[]>([]);
    const [isLlmSet, setIsLlmSet] = useState(false);

    const token = ""; // Assuming this will be provided or managed elsewhere

    // Type guard to check if the error is of type Error
    const isError = (err: unknown): err is Error => {
        return err instanceof Error;
    };

    const handleApiKeySubmit = async () => {
        try {
            const res = await fetch('http://localhost/api/llm/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ apiKey: apiKey }),
            });

            if (res.status === 401) {
                // Handle 401 Unauthorized error
                setErrors(prevErrors => [...prevErrors, 'Unauthorized. Please log in.']);
                throw new Error('Unauthorized');
            }

            const data = await res.json();

            if (data.success) {
                setContextTitle(data.contextTitle);
            } else {
                setErrors(prevErrors => [...prevErrors, 'Error storing API key']);
            }
        } catch (error: unknown) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred while storing API key.']);
            }
        }
    };

    const sendMessage = async () => {
        setResponse('');
        try {
            const res = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });

            if (!res.body) {
                throw new Error('Response body is null');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let partialResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                partialResponse += decoder.decode(value, { stream: true });
                setResponse((prev) => prev + partialResponse);
            }
        } catch (error: unknown) {
            console.error('Error sending message:', error);
            if (isError(error)) {
                setErrors((prevErrors) => [...prevErrors, error.message]);
            } else {
                setErrors((prevErrors) => [...prevErrors, 'An unknown error occurred while sending message.']);
            }
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost/api/show-current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    throw new Error('Unauthorized. You may need to relaunch this page.');
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                //should always contain context as that is passed in token
                setContextTitle(result.data.lms_context_title);
                if (result.status === 'success') {
                    setIsLlmSet(true);
                } //else {
                //    throw new Error('Problem getting context. You may need to relaunch this page.');
                //}
            } catch (error: unknown) {
                if (isError(error)) {
                    setErrors(prevErrors => [...prevErrors, error.message]);
                } else {
                    setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
                }
            }
        };

        fetchData();
    }, [token]); // Adding `token` to the dependency array

    return (
        <div>
            {/* Errors displayed at the top */}
            {errors.length > 0 && (
                <div>
                    {errors.map((error, index) => (
                        <Alert key={index} variant="error" margin="small">
                            {error}
                        </Alert>
                    ))}
                </div>
            )}

            {/* Conditional rendering based on contextTitle */}
            {!isLlmSet ? (
                <>
                    <Alert variant="warning" margin="small">
                        No ChatGPT API key set for: {contextTitle}. Please enter a key below:
                    </Alert>
                    <form onSubmit={(e) => { e.preventDefault(); handleApiKeySubmit(); }}>
                        <TextInput
                            value={apiKey}
                            display="inline-block"
                            renderLabel={<ScreenReaderContent>API Key</ScreenReaderContent>}
                            placeholder="ChatGPT API Key"
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <Button margin="xx-small" type="submit">
                            Submit
                        </Button>
                    </form>
                </>
            ) : (
                <div>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    &nbsp;&nbsp;
                    <Button margin="xx-small" onClick={sendMessage}>
                        Send
                    </Button>
                    <div>{response}</div>
                </div>
            )}
        </div>
    );
}

export default Chat;