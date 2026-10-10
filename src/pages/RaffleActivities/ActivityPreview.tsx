import type { ActivityDetail, ActivityStage } from '@/services/activity';
import { Alert, Button, Empty, Modal, Skeleton, Space, Tag, Typography } from 'antd';
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  activity?: ActivityStage;
  detail?: ActivityDetail;
  loading: boolean;
  error?: string;
  onRetry: () => void;
};

export default function ActivityPreview({
  open,
  onClose,
  activity,
  detail,
  loading,
  error,
  onRetry,
}: Props) {
  const now = Date.now();
  const begin = activity?.beginDateTime ? new Date(activity.beginDateTime).getTime() : NaN;
  const end = activity?.endDateTime ? new Date(activity.endDateTime).getTime() : NaN;
  const status =
    now > end
      ? '已结束'
      : now < begin
      ? '未开始'
      : activity?.activityState === 'close'
      ? '已关闭'
      : activity?.state !== 'active'
      ? '未上架'
      : '进行中';
  const awards = [...(detail?.awards ?? [])].sort(
    (a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0),
  );
  const mainEntry =
    activity?.state === 'active' && activity.channel === 'c01' && activity.source === 's01';
  const userUrl =
    typeof window === 'undefined'
      ? undefined
      : `${window.location.protocol}//${window.location.hostname}:3002/#/market`;

  return (
    <Modal
      title="用户端预览 · 只读配置"
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        <Space>
          {mainEntry && (
            <Button href={userUrl} target="_blank" rel="noopener noreferrer">
              打开当前用户页面
            </Button>
          )}
          <Button onClick={onClose}>关闭预览</Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="展示所选活动的奖品配置，不会扣次数或发奖。实际用户页面以活动有效期和用户解锁状态为准。"
      />
      <Typography.Title level={3}>{activity?.activityName || '幸运抽奖'}</Typography.Title>
      <Space wrap>
        <Tag color={status === '进行中' ? 'green' : 'orange'}>{status}</Tag>
        <Typography.Text type="secondary">活动 {activity?.activityId}</Typography.Text>
      </Space>
      <Typography.Paragraph>{activity?.activityDesc}</Typography.Paragraph>
      {loading ? (
        <Skeleton active />
      ) : error ? (
        <Alert
          type="error"
          message="奖品加载失败"
          description={error}
          action={<Button onClick={onRetry}>重试</Button>}
        />
      ) : !detail ? (
        <Empty description="活动详情暂不可用" />
      ) : !awards.length ? (
        <Empty description="暂无奖品配置" />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
            padding: 12,
            background: '#ffcc70',
            borderRadius: 12,
          }}
        >
          {awards.map((award, index) => (
            <React.Fragment key={`${award.awardId}-${index}`}>
              {awards.length === 8 && index === 4 && (
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    background: '#2675ff',
                    color: 'white',
                    borderRadius: 8,
                  }}
                >
                  幸运抽奖
                </div>
              )}
              <div
                style={{
                  minHeight: 110,
                  padding: 16,
                  textAlign: 'center',
                  background: '#fffdf6',
                  borderRadius: 8,
                  overflowWrap: 'anywhere',
                }}
              >
                <div aria-hidden="true" style={{ fontSize: 28 }}>
                  🎁
                </div>
                <strong>{award.awardTitle || `奖品 ${award.awardId}`}</strong>
                {award.awardSubtitle && <div>{award.awardSubtitle}</div>}
                {Number(award.awardRuleLockCount) > 0 && (
                  <div style={{ color: '#8c6b29', fontSize: 12 }}>
                    当天累计参与 {award.awardRuleLockCount} 次后解锁
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
      <Button block disabled style={{ marginTop: 16 }}>
        只读预览，不可抽奖
      </Button>
    </Modal>
  );
}
