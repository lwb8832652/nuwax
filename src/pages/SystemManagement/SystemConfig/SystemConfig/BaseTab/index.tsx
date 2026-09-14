import { t } from '@/services/i18nRuntime';
import {
  apiSystemAgentList,
  apiSystemConfigUpdate,
  apiUseableModelList,
} from '@/services/systemManage';
import {
  ModelConfigDto,
  PublishedDto,
  SystemUserConfig,
  TabKey,
} from '@/types/interfaces/systemManage';
import { Form, message } from 'antd';
import classNames from 'classnames';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import BaseFormItem from '../BaseFormItem';
import styles from './index.less';

const cx = classNames.bind(styles);

// 基础配置中的图片类字段
const FILE_FIELDS = ['siteLogo', 'faviconUrl', 'squareBanner'];

const BaseTab = forwardRef(
  (
    {
      config,
      currentTab,
      refresh,
    }: {
      config: SystemUserConfig[];
      currentTab: TabKey;
      refresh: () => Promise<void>;
    },
    ref,
  ) => {
    const [form] = Form.useForm();
    const [modelList, setModelList] = useState<ModelConfigDto[]>([]);
    const [agentList, setAgentList] = useState<PublishedDto[]>([]);

    // 暴露提交接口给父组件
    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
    }));

    // 查询可选模型列表
    const fetchModelList = async () => {
      const res = await apiUseableModelList();
      setModelList(res.data);
    };
    // 查询可选择的智能体列表
    const fetchAgentList = async (kw = '') => {
      const res = await apiSystemAgentList(kw);
      setAgentList(res.data);
    };

    useEffect(() => {
      if (currentTab === 'ModelSetting') {
        fetchModelList();
      }
      if (currentTab === 'AgentSetting') {
        fetchAgentList();
      }
    }, [currentTab]);

    const onFinish = async (values: any) => {
      const params: any = {};
      // 图片类配置：上传未完成/失败时不能写入空值，否则会清掉已有图片（如站点 LOGO）
      let hasUnfinishedUpload = false;

      Object.keys(values).forEach((key) => {
        const value = values[key];

        if (currentTab === 'BaseConfig' && FILE_FIELDS.includes(key)) {
          if (typeof value === 'string') {
            // 未改动，原样回传（保留已有图片地址）
            params[key] = value;
          } else if (value?.file) {
            const url = value.file.response?.data?.url;
            if (url) {
              params[key] = url;
            } else {
              // 上传中或上传失败，无可用地址
              hasUnfinishedUpload = true;
            }
          } else {
            // 用户主动移除图片，允许置空
            params[key] = '';
          }
          return;
        }

        // 处理清空的情况，传 -1 给后端
        if (value === undefined || value === null) {
          params[key] = -1;
        } else if (value?.file) {
          params[key] = value.file.response?.data?.url;
        } else {
          params[key] = value as any;
        }
      });

      if (hasUnfinishedUpload) {
        message.error(t('PC.Pages.SystemConfig.uploadNotFinished'));
        return;
      }

      await apiSystemConfigUpdate(params);
      message.success(t('PC.Pages.SystemConfig.saveSuccess'));
      refresh();
    };

    return (
      <div className={cx(styles.container, 'scroll-container', 'flex-1')}>
        <Form
          layout="vertical"
          style={{ width: '520px' }}
          form={form}
          onFinish={onFinish}
        >
          {config.map((v) => {
            return (
              <BaseFormItem
                props={v}
                key={v.name}
                modelList={modelList}
                agentList={agentList}
                currentTab={currentTab}
              />
            );
          })}
        </Form>
      </div>
    );
  },
);

export default BaseTab;
