import React from "react";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";

const CalendarConnectPrompt = ({ 
  context, 
  onConnect, 
  onSkip, 
  onClose,
  isVisible = false 
}) => {
  if (!isVisible) return null;

  const getPromptContent = (context) => {
    switch (context) {
      case 'create':
        return {
          title: "🗓️ Create Your First Event",
          description: "To help you find the best time for your event, we'd like to check your Google Calendar availability.",
          benefits: [
            "✓ Automatic availability checking",
            "✓ Smart time suggestions", 
            "✓ No double bookings"
          ]
        };
      case 'view':
        return {
          title: "📅 View Availability",
          description: "Connect your Google Calendar to see when everyone is free for your event.",
          benefits: [
            "✓ See everyone's availability",
            "✓ Find the best meeting time",
            "✓ Avoid scheduling conflicts"
          ]
        };
      default:
        return {
          title: "📅 Connect Your Calendar",
          description: "Connect your Google Calendar to get the most out of your event coordination.",
          benefits: [
            "✓ Smart availability checking",
            "✓ Automatic time suggestions",
            "✓ Seamless scheduling"
          ]
        };
    }
  };

  const content = getPromptContent(context);

  return (
    <Modal isOpen={isVisible} onClose={onClose}>
      <div className="calendar-connect-prompt">
        <div className="prompt-header">
          <div className="icon">{content.title.split(' ')[0]}</div>
          <h3>{content.title.split(' ').slice(1).join(' ')}</h3>
        </div>
        
        <div className="prompt-content">
          <p className="description">{content.description}</p>
          
          <div className="benefits">
            {content.benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                {benefit}
              </div>
            ))}
          </div>
        </div>
        
        <div className="prompt-actions">
          <Button 
            onClick={onConnect} 
            className="primary"
            style={{ marginRight: '12px' }}
          >
            Connect Google Calendar
          </Button>
          <Button 
            onClick={onSkip} 
            className="secondary"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarConnectPrompt;
