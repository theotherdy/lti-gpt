import { useState } from 'react';

//import { Alert } from '@instructure/ui-alerts'
import { Button } from '@instructure/ui-buttons';
import { CloseButton } from '@instructure/ui-buttons'
import { Heading } from '@instructure/ui-heading'
import { IconButton } from '@instructure/ui-buttons'
import { IconChatLine } from '@instructure/ui-icons'
import { Link } from '@instructure/ui-link'
import { Modal } from '@instructure/ui-modal'
import { IconTrashLine } from '@instructure/ui-icons'
import { TruncateText } from '@instructure/ui-truncate-text'

import { Conversation } from './Interfaces';

interface ConversationsProps {
  conversations: Conversation[]; // Receive conversations as a prop
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteAllConversations: () => void;
}

const Conversations = ({ conversations, onSelectConversation, onDeleteAllConversations }: ConversationsProps) => {
    //const [conversations, setConversations] = useState<Conversation[]>([]);
    const [showAlert, setShowAlert] = useState(false);
  
    /*useEffect(() => {
      const storedConversations = localStorage.getItem('conversations');
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
    }, []);*/
  
    const handleSelectConversation = (conversation: Conversation) => {
      onSelectConversation(conversation);
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
      <div style={{ width: '250px', borderRight: '1px solid #ddd', padding: '10px', height: 'calc(100% - 90px)' }}>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 39px)' }}>
          {conversations.map((conversation) => (
            <Link
              key={conversation.id} 
              onClick={() => handleSelectConversation(conversation)}
              isWithinText={false}
              renderIcon={<IconChatLine size="x-small" />}
              margin='xx-small'
            >
              <TruncateText>{formatTimestamp(conversation.timestamp)}</TruncateText>
            </Link>
          ))}
        </div>
        {conversations.length > 0 && (
          <div className="chat-drawer-tray-footer">
            <IconButton
              color="secondary"
              onClick={handleConfirmDelete}
              screenReaderLabel="Delete All Conversations"
              >
                <IconTrashLine />
          </IconButton>
        </div>
        )}
        
        <Modal
          open={showAlert}
          onDismiss={() => { setShowAlert(false) }}
          size="auto"
          label="Confirm delete all conversations"
          shouldCloseOnDocumentClick
        >
          <Modal.Header>
            <CloseButton
              placement="end"
              offset="small"
              onClick={handleCancelDelete}
              screenReaderLabel="Close"
            />
            <Heading>Please confirm deletion</Heading>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete all conversations? This action is irreversible.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleCancelDelete} color="secondary" margin="small">Cancel</Button>
            <Button onClick={() => {
                onDeleteAllConversations();
                setShowAlert(false);
            }} margin="0 x-small 0 0">Delete</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };
  
  export default Conversations;