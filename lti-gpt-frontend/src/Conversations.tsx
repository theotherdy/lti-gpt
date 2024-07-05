import { useEffect, useState } from 'react';

import { Alert } from '@instructure/ui-alerts'
import { Button } from '@instructure/ui-buttons';
import { List } from '@instructure/ui-list'

import { Conversation } from './Interfaces';

interface ConversationsProps {
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

const Conversations = ({ onSelectConversation, onNewConversation }: ConversationsProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showAlert, setShowAlert] = useState(false);
  
    useEffect(() => {
      const storedConversations = localStorage.getItem('conversations');
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
    }, []);
  
    const handleSelectConversation = (conversation: Conversation) => {
      onSelectConversation(conversation);
    };
  
    const handleNewConversation = () => {
      onNewConversation();
    };
  
    const handleDeleteAllConversations = () => {
      localStorage.removeItem('conversations');
      setConversations([]); // Clear the state so the UI updates accordingly
      setShowAlert(false);
    };
  
    const handleConfirmDelete = () => {
      setShowAlert(true);
    };
  
    const handleCancelDelete = () => {
      setShowAlert(false);
    };
  
    const formatTimestamp = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
  
    return (
      <div style={{ width: '250px', borderRight: '1px solid #ddd', padding: '1rem' }}>
        <Button color="primary" onClick={handleNewConversation} margin="small">
          New Conversation
        </Button>
        <List>
          {conversations.map((conversation) => (
            <List.Item key={conversation.id} onClick={() => handleSelectConversation(conversation)}>
              {formatTimestamp(conversation.timestamp)}
            </List.Item>
          ))}
        </List>
        {conversations.length > 0 && (
        <Button
          color="danger"
          onClick={handleConfirmDelete}
          margin="small"
        >
          Delete All Conversations
        </Button>
        )}
        {showAlert && (
          <Alert
            variant="error"
            margin="small"
          >
            <p>Are you sure you want to delete all conversations? This action is irreversible.</p>
            <Button onClick={handleDeleteAllConversations} color="danger" margin="small">Confirm</Button>
            <Button onClick={handleCancelDelete} color="secondary" margin="small">Cancel</Button>
          </Alert>
        )}
      </div>
    );
  };
  
  export default Conversations;