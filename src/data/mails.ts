export type MailIcon = 'star' | 'letter';

export type Mail = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  icon: MailIcon;
  tint: string;
};

export const MAILS: Mail[] = [
  {
    id: 'google-1',
    sender: 'Google',
    subject: 'You shared some Google Account data...',
    preview:
      "Keep track of your Google Account data navigatoricsl@gmail.com You're",
    time: '下午 6:38',
    unread: true,
    icon: 'star',
    tint: '#CB75C6',
  },
  {
    id: 'google-2',
    sender: 'Google',
    subject: 'You shared some Google Account data...',
    preview:
      "Keep track of your Google Account data navigatoricsl@gmail.com You're",
    time: '下午 6:36',
    unread: true,
    icon: 'star',
    tint: '#CB75C6',
  },
  {
    id: 'apple-1',
    sender: 'Apple',
    subject: '你的 Apple ID 已在新设备上登录',
    preview: '如果这不是你本人的操作，请立即更改密码。',
    time: '下午 4:02',
    unread: false,
    icon: 'letter',
    tint: '#8E8E93',
  },
  {
    id: 'icloud-1',
    sender: 'iCloud',
    subject: '你的 iCloud 储存空间快满了',
    preview: '升级方案后即可继续备份这台 iPhone 上的照片和邮件。',
    time: '昨天',
    unread: false,
    icon: 'letter',
    tint: '#5AC8FA',
  },
  {
    id: 'notes-1',
    sender: '腾讯企业邮',
    subject: '本周会议纪要',
    preview: '请查收附件。如需改期，直接回复这封邮件即可。',
    time: '星期一',
    unread: false,
    icon: 'letter',
    tint: '#34C759',
  },
];
