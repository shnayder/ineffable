import React from 'react';

export interface Comment {
  id: string;
  text: string;
}

interface CommentCardProps {
  comment: Comment;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {

  return (
    <div
      className="ml-4 bg-surface-bg-overlay border border-surface-border-overlay rounded px-3 py-2 min-w-[180px] shadow"
    >
        <p className="text-sm text-gray-800">{comment.text}</p>
    </div>
  );
};

export default CommentCard;
