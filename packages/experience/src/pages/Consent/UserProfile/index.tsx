import { type ConsentInfoResponse } from '@logto/schemas';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import UserAvatar from '@/assets/icons/default-user-avatar.svg?react';

type Props = {
  readonly user: ConsentInfoResponse['user'];
  readonly className?: string;
};

const UserProfile = ({
  user: { id, avatar, name, primaryEmail, primaryPhone, username },
  className,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className={classNames(
        'border border-line-strong rounded-[13px] p-4 flex items-center',
        className
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt="avatar"
          className="w-10 h-10 rounded-[8px] object-cover object-center me-3"
        />
      ) : (
        <UserAvatar className="w-10 h-10 rounded-[8px] object-cover object-center me-3" />
      )}
      <div>
        <div className="text-sm font-medium">{name ?? t('description.user_id', { id })}</div>
        <div className="text-xs text-muted">{primaryEmail ?? primaryPhone ?? username}</div>
      </div>
    </div>
  );
};

export default UserProfile;
