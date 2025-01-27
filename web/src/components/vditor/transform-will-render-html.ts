import { getResourceUrl } from '@/utils/resource-url';
import { getLoginUser } from '@/api/base/user';

const parseHTMLTemp = document.createElement('template');

function tryAppendResourceBaseUrl(src: string | null, appendResAuthToken?: boolean): string {
  if (!src) return '';
  if (/^(https?:|data:|file:|\/|\.|#|\?)/.test(src)) {
    return src;
  }
  src = getResourceUrl(src);
  if (appendResAuthToken) {
    src = src.replace(/\?.*/, '');
    const loginUser = getLoginUser();
    if (loginUser) {
      src += `?uid=${loginUser.id}&token=${loginUser.token?.substring(0, 8)}`; // 请求资源的 token 为 user-token 前8位
    }
  }
  return src;
}

function removeResourceBaseUrl(src: string | null): string {
  if (!src) return '';
  if (src.startsWith(window.MBBS_RESOURCE_BASE_URL)) {
    return src.substring(window.MBBS_RESOURCE_BASE_URL.length);
  }
  return src || '';
}

export default function transformWillRenderHtml(html: string, transformAttachmentLink?: boolean) {
  parseHTMLTemp.innerHTML = html;

  // 图片资源路径 转 静态资源服务器开头的绝对地址
  Array.from(parseHTMLTemp.content.querySelectorAll('img')).forEach((img) => {
    if (
      img.getAttribute('data-src')?.startsWith('data:image') || // base64 图片无需 lazyLoading
      /^\^.*\^$/.test(img.getAttribute('alt') || '') // alt="^...^" 的图片无需 lazyLoading （回复可见 tag 图片）
    ) {
      img.src = img.getAttribute('data-src') || img.src || '';
      return;
    }
    if (img.getAttribute('src')) {
      img.setAttribute('src', tryAppendResourceBaseUrl(img.getAttribute('src')));
    }
    if (img.getAttribute('data-src')) {
      img.setAttribute('data-src', tryAppendResourceBaseUrl(img.getAttribute('data-src')));
    }
  });

  // 将 data-next-node-style 元素的样式设置给相邻下一个元素（扩展Markdown标签的 字体/颜色/对齐 功能）
  Array.from(parseHTMLTemp.content.querySelectorAll('[data-next-node-style]')).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const nextEl = node.nextElementSibling;
    if (!(nextEl instanceof HTMLElement)) return;
    nextEl.style.cssText = node.style.cssText;
  });

  // 附件下载地址(补上静态资源服务器开头的绝对地址)
  if (transformAttachmentLink) {
    Array.from(parseHTMLTemp.content.querySelectorAll('a')).forEach((a) => {
      const isVideo = /\.(mp4|avi)$/.test(a.href);
      a.setAttribute('href', tryAppendResourceBaseUrl(a.getAttribute('href'), true));
      if (isVideo) {
        a.outerHTML = `<video src="${a.href}" controls preload="none"></video>`;
      }
    });
  }

  return parseHTMLTemp.innerHTML;
}

export function transformRenderHtmlForUpload(html: string) {
  parseHTMLTemp.innerHTML = html;

  // 静态资源服务器开头的图片地址 转 资源路径
  Array.from(parseHTMLTemp.content.querySelectorAll('img')).forEach((img) => {
    if (img.getAttribute('src')) {
      img.setAttribute('src', removeResourceBaseUrl(img.getAttribute('src')));
    }
    if (img.getAttribute('data-src')) {
      img.setAttribute('data-src', removeResourceBaseUrl(img.getAttribute('data-src')));
    }
  });

  // 非 http 开头的 a 链接，补上 http 开头
  Array.from(parseHTMLTemp.content.querySelectorAll('a')).forEach((a) => {
    let url = a.getAttribute('href');
    if (!url) return;
    url = removeResourceBaseUrl(url);
    if (!/^https?:/.test(url) && url.split('/')[0].includes('.')) {
      a.setAttribute('href', `http://${url}`);
    }
  });

  // 移除空的 data-next-node-style 节点
  Array.from(parseHTMLTemp.content.querySelectorAll('[data-next-node-style]')).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (!node.style.cssText && node.parentElement?.parentElement) {
      node.parentElement.parentElement.remove();
    }
  });

  return parseHTMLTemp.innerHTML;
}
