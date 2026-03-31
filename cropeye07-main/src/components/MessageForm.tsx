import React from 'react';
import { Send } from 'lucide-react';

interface MessageFormProps {
  selectedContact: string | null;
  message: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MessageForm: React.FC<MessageFormProps> = ({
  selectedContact,
  message,
  onChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="bg-gray-50 p-4 rounded border">
    <h3 className="text-lg font-bold mb-2">Send Message</h3>
    <div className="mb-2">
      <label className="text-sm">Selected Contact:</label>
      <div className="bg-white p-2 border rounded">
        {selectedContact || 'Select contact'}
      </div>
    </div>
    <div className="mb-2">
      <label htmlFor="message" className="text-sm">Message:</label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded mt-1"
        rows={4}
        placeholder="Type your message here..."
      />
    </div>
    <button
      type="submit"
      disabled={!selectedContact || !message}
      className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      <Send size={16} className="inline mr-1" />
      Send
    </button>
  </form>
);

export default MessageForm;
