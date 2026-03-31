import React from 'react';
import { Phone } from 'lucide-react';

interface Contact {
  name: string;
  phone: string;
  role: string;
}

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onSelect }) => (
  <div
    onClick={() => onSelect(contact)}
    className="border border-gray-300 p-4 rounded hover:bg-gray-100 cursor-pointer"
  >
    <p className="font-medium">{contact.name}</p>
    <a href={`tel:${contact.phone}`} className="text-blue-600 flex items-center gap-2 mt-1">
      <Phone size={16} />
      {contact.phone}
    </a>
  </div>
);

export default ContactCard;
