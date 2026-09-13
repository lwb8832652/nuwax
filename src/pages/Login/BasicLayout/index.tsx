import ConditionRender from '@/components/ConditionRender';
import SiteFooter from '@/components/SiteFooter';
import { dict } from '@/services/i18nRuntime';
import { CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';
import React from 'react';
import { useModel } from 'umi';
import LoginLangSwitcher from '../LoginLangSwitcher';
import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 登录页骨架：Header（品牌 + 语言切换）+ 主区（左品牌区 + 右登录卡片）+ Footer
 * 视觉对齐 Figma 原型（node 0:6 "Login"）
 */
const BasicLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const siteName = tenantConfigInfo?.siteName || 'NewX';

  const features = [
    {
      icon: <FileTextOutlined />,
      title: dict('PC.Pages.Login.featureOfficeTitle'),
      sub: dict('PC.Pages.Login.featureOfficeSub'),
    },
    {
      icon: <CodeOutlined />,
      title: dict('PC.Pages.Login.featureDevTitle'),
      sub: dict('PC.Pages.Login.featureDevSub'),
    },
  ];

  const traits = [
    {
      no: '01',
      title: dict('PC.Pages.Login.trait1Title'),
      desc: dict('PC.Pages.Login.trait1Desc'),
    },
    {
      no: '02',
      title: dict('PC.Pages.Login.trait2Title'),
      desc: dict('PC.Pages.Login.trait2Desc'),
    },
    {
      no: '03',
      title: dict('PC.Pages.Login.trait3Title'),
      desc: dict('PC.Pages.Login.trait3Desc'),
    },
  ];

  return (
    <div className={cx(styles.container)}>
      <header className={cx(styles.header)}>
        <div className={cx(styles['header-inner'])}>
          <div className={cx(styles.brand)}>
            <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
              <img
                src={tenantConfigInfo?.siteLogo}
                className={cx(styles['brand-logo'])}
                alt=""
              />
            </ConditionRender>
            <span className={cx(styles['brand-name'])}>{siteName}</span>
          </div>
          <LoginLangSwitcher />
        </div>
      </header>

      <main className={cx(styles.main)}>
        <aside className={cx(styles.sidebar)}>
          <p className={cx(styles.slogan)}>
            {dict('PC.Pages.Login.brandSlogan')}
          </p>
          <ConditionRender condition={!!tenantConfigInfo?.loginPageText}>
            <h1
              className={cx(styles.title)}
              dangerouslySetInnerHTML={{
                __html: tenantConfigInfo?.loginPageText,
              }}
            />
          </ConditionRender>
          <ConditionRender condition={!!tenantConfigInfo?.loginPageSubText}>
            <p
              className={cx(styles['sub-title'])}
              dangerouslySetInnerHTML={{
                __html: tenantConfigInfo?.loginPageSubText,
              }}
            />
          </ConditionRender>

          <div className={cx(styles['feature-grid'])}>
            {features.map((item) => (
              <div key={item.title} className={cx(styles['feature-card'])}>
                <span className={cx(styles['feature-icon'])}>{item.icon}</span>
                <span className={cx(styles['feature-text'])}>
                  <span className={cx(styles['feature-title'])}>
                    {item.title}
                  </span>
                  <span className={cx(styles['feature-sub'])}>{item.sub}</span>
                </span>
              </div>
            ))}
          </div>

          <div className={cx(styles['trait-list'])}>
            {traits.map((item) => (
              <div key={item.no} className={cx(styles['trait-row'])}>
                <span className={cx(styles['trait-no'])}>
                  <i className={cx(styles['trait-bar'])} />
                  {item.no}
                </span>
                <span className={cx(styles['trait-title'])}>{item.title}</span>
                <span className={cx(styles['trait-desc'])}>{item.desc}</span>
              </div>
            ))}
          </div>

          <p className={cx(styles.quote)}>
            {dict('PC.Pages.Login.leftQuote', siteName)}
          </p>
        </aside>

        <section className={cx(styles.panel)}>{children}</section>
      </main>

      <footer className={cx(styles['page-footer'])}>
        <SiteFooter
          text={tenantConfigInfo?.pageFooterText}
          className={cx(styles['site-footer'])}
        />
      </footer>
    </div>
  );
};

export default BasicLayout;
