'use client';

import Image from 'next/image';
import Link from 'next/link';

import SearchBox from '@/components/navigation/topnavigation/SearchBox';
import GlobalCreateButton from '@/components/navigation/GlobalCreateButton';
import HelpIcon from '@/components/navigation/topnavigation/HelpIcon';
import NotificationIcon from '@/components/navigation/topnavigation/NotificationIcon';
import ProfileIcon from '@/components/navigation/topnavigation/ProfileIcon';
import AppLauncher from '@/components/navigation/topnavigation/AppLauncher';

type App = {
  key: string;
  label: string;
};

type Props = {
  collapsed: boolean;
  selectedApp: App;
  onAppSelect?: (app: App) => void;
};

export default function TopNavigationBar({
  collapsed,
  selectedApp,
  onAppSelect,
}: Props) {
  return (
    <header
      className="
        h-[55px] w-full box-border
        grid grid-cols-[auto_1fr_auto]
        items-center px-2
        bg-white dark:bg-ui-navigationDark
        border-b border-gray-200 dark:border-gray-700
      "
    >
      {/* LEFT */}
      <div className="flex items-center h-full shrink-0 gap-3">
        {/* App Launcher */}
        <div className="w-[190px] h-full flex items-center">
          <AppLauncher
            collapsed={collapsed}
            selected={selectedApp}
            onSelect={onAppSelect}
          />
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center h-full w-[140px]">
          {/* Light */}
          <Image
            src="/logo/logo-green.svg"
            alt="Saltify"
            width={120}
            height={26}
            className="object-contain dark:hidden"
            priority
          />
          {/* Dark */}
          <Image
            src="/logo/logo-white.svg"
            alt="Saltify"
            width={120}
            height={26}
            className="object-contain hidden dark:block"
            priority
          />
        </Link>
      </div>

      {/* CENTER */}
      <div className="flex items-center justify-center h-full w-full">
        <SearchBox className="h-[40px] w-full max-w-[600px]" />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 pr-3 h-full">
        <div className="grid place-items-center h-full">
          <GlobalCreateButton />
        </div>

        <div className="grid place-items-center h-full">
          <HelpIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </div>

        <div className="grid place-items-center h-full">
          <NotificationIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </div>

        <div className="grid place-items-center h-full">
          <ProfileIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </div>
      </div>
    </header>
  );
}
