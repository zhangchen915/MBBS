import React from 'react';

const MarkdownPureText: React.FC<{
  md: string;
}> = ({ md }) => {
  return <div dangerouslySetInnerHTML={{ __html: md }} />;
};

export default MarkdownPureText;
