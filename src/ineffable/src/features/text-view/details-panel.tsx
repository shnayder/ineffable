import React from 'react';
import CommentCard, { Comment } from './comment-card';

interface DetailsPanelProps {
  comments: Comment[];
  top: number;
  selectedId: string;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ comments, top, selectedId }) => {
  return (
    <div 
        className="w-80 min-w-[200px] max-w-[320px] bg-surface-bg-base border-surface-border-base border-1 p-4 rounded ml-8"
//        style={top}
    >
      <div className="mb-2">
        <strong>Selected:</strong> <span className="text-gray-800">{selectedId || <span className="text-gray-400">None</span>}</span>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="font-semibold mb-1">Comments</div>
        {comments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment} 
           />
          ))}
      </div>
    </div>
  );
};

export default DetailsPanel;
