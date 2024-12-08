import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
   
  ],
  actions: [
    { text: 'Github', href: 'https://github.com/emergy-official/assets.parf.ai', icon: 'tabler:brand-github', target: '_blank' },
  ],
};

export const footerData = {
  links: [],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],

  socialLinks: [
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/in/ml2/',
    },
  ],
};
