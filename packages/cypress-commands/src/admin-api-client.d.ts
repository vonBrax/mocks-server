declare module '@mocks-server/admin-api-client' {
  export interface MocksServerConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface ApiClientConfig {
    host?: string;
    port?: number;
  }

  export type Id = string
  export type CollectionId = Id;

  export type DelayTime = number;
  export type RouteVariantId = `${Id}:${Id}`

  function updateConfig(config: MocksServerConfig): Promise<void>
  function useRouteVariant(routeVariantId: RouteVariantId): Promise<void>
  function restoreRouteVariants(): Promise<void>
  function configClient(clientConfig: ApiClientConfig): Promise<void>

  export interface AdminApiClientMethods {
    updateConfig: typeof updateConfig,
    useRouteVariant: typeof useRouteVariant,
    restoreRouteVariants: typeof restoreRouteVariants,
    configClient: typeof configClient
  }
}
