import React, { useEffect } from 'react';
import MarkdownEditorSubmit, { MarkdownEditorSubmitProps } from '@/components/vditor/markdown-editor-submit';
import { permissionApi } from '@/api';
import './thread-content-style.less';

const ThreadContentEditor: React.FC<
  MarkdownEditorSubmitProps & {
    categoryId: number;
  }
> = (props) => {
  const { categoryId, ...otherProps } = props;

  useEffect(() => {
    permissionApi.getMyPermissions().then((permissions) => {
      const hasPermission =
        permissions.includes('thread.createHiddenContent') || permissions.includes(`category${categoryId}.thread.createHiddenContent`);
    });
  }, [categoryId]);

  return <MarkdownEditorSubmit {...otherProps} />;
};

export default ThreadContentEditor;
