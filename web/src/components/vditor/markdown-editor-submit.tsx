import React, { ReactNode, useEffect, useState } from 'react';
import '@wangeditor/editor/dist/css/style.css';
import DoTaskButton from '@/components/do-task-button';
import { useTheme } from '@mui/material';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import Box, { BoxProps } from '@mui/material/Box/Box';

export declare type MarkdownEditorProps = {
  defaultMarkdown?: string;
  className?: string;
  canUploadImage?: boolean;
  canUploadFile?: boolean;
  renderActions?: ReactNode | (() => ReactNode);
  onEditingNodeChange?: (node: HTMLElement) => void;
} & BoxProps;

export declare type MarkdownEditorSubmitProps = {
  submitText?: string;
  cancelText?: string;
  failAlert?: boolean;
  onSubmit: (markdown: string) => Promise<void | any>;
  onCancel?: (markdown: string) => Promise<void | any>;
  onCancelFailAlert?: boolean;
} & Omit<MarkdownEditorProps, 'onSubmit'>;

const MarkdownEditorSubmit: React.FC<MarkdownEditorSubmitProps> = (props) => {
  const {
    submitText = '提交',
    failAlert,
    onSubmit,
    cancelText,
    onCancel,
    sx,
    renderActions,
    onCancelFailAlert = failAlert,
    ...otherProps
  } = props;
  const theme = useTheme();

  // editor 实例
  const [editor, setEditor] = useState<IDomEditor | null>(null); // TS 语法

  // 编辑器内容
  const [html, setHtml] = useState(props.defaultMarkdown);

  // 工具栏配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['uploadImage', 'uploadVideo', 'codeSelectLang'],
  };

  // 自定义校验视频
  function customCheckVideoFn(src: string, poster: string): boolean | string | undefined {
    if (!src) {
      return;
    }
    if (src.indexOf('http') !== 0) {
      return '视频地址必须以 http/https 开头';
    }
    return true;

    // 返回值有三种选择：
    // 1. 返回 true ，说明检查通过，编辑器将正常插入视频
    // 2. 返回一个字符串，说明检查未通过，编辑器会阻止插入。会 alert 出错误信息（即返回的字符串）
    // 3. 返回 undefined（即没有任何返回），说明检查未通过，编辑器会阻止插入。但不会提示任何信息
  }

  // 自定义转换视频
  function customParseVideoSrc(src: string): string {
    if (src.includes('.bilibili.com')) {
      const arr = location.pathname.split('/');
      const vid = arr[arr.length - 1];
      return `<iframe src="//player.bilibili.com/player.html?bvid=${vid}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>`;
    }
    return src;
  }

  // 编辑器配置
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      insertVideo: {
        onInsertedVideo(videoNode: { src: any } | null) {
          if (videoNode == null) return;

          const { src } = videoNode;
          console.log('inserted video', src);
        },
        checkVideo: customCheckVideoFn, // 也支持 async 函数
        parseVideoSrc: customParseVideoSrc, // 也支持 async 函数
      },
    },
  };

  // 及时销毁 editor ，重要！
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <Box {...otherProps} display="flex" sx={{ ...sx, position: 'relative' }}>
      <div>
        <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default" style={{ borderBottom: '1px solid #ccc' }} />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={(editor) => setHtml(editor.getHtml())}
          mode="default"
          style={{ height: '500px', overflowY: 'hidden' }}
        />
      </div>

      <Box
        sx={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          zIndex: 1,
        }}
      >
        {cancelText && (
          <DoTaskButton
            variant="contained"
            size="large"
            sx={{
              borderRadius: '100vh',
              background: theme.palette.grey['200'],
              color: theme.palette.grey['700'],
              boxShadow: theme.shadows[5],
              mr: 1,
              pl: 2,
              pr: 2,
              minWidth: 80,
            }}
            failAlert={onCancelFailAlert}
            task={async () => {
              if (!onCancel) return;
              await onCancel(html || '');
            }}
          >
            {cancelText}
          </DoTaskButton>
        )}
        <DoTaskButton
          variant="contained"
          size="large"
          sx={{
            borderRadius: '100vh',
            boxShadow: theme.shadows[5],
            pl: 2,
            pr: 2,
            minWidth: 80,
          }}
          failAlert={failAlert}
          task={async () => {
            await onSubmit(html || '');
          }}
        >
          {submitText}
        </DoTaskButton>
      </Box>
    </Box>
    // <MarkdownEditor
    //   {...otherProps}
    //   renderActions={
    //     <>
    //       {typeof renderActions === 'function' ? renderActions() : renderActions}
    //
    //     </>
    //   }
    // />
  );
};

export default MarkdownEditorSubmit;
