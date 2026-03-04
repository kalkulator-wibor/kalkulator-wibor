export interface TabModule {
  id: string;
  label: string;
  Component: React.ComponentType;
}

export interface AppModule {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'page' | 'sheet';
  Component: React.ComponentType;
  alwaysEnabled?: boolean;
  showInHeader?: boolean;
  comingSoon?: boolean;
}
