import {
  InvalidateOptions,
  InvalidateQueryFilters,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { pickDataProvider } from "@definitions";
import { useResource } from "@hooks/resource";
import { useKeys } from "@hooks/useKeys";
import { BaseKey, IQueryKeys } from "../../interfaces";

export type UseInvalidateProp = {
  resource?: string;
  id?: BaseKey;
  dataProviderName?: string;
  invalidates: Array<keyof IQueryKeys> | false;
  invalidationFilters?: InvalidateQueryFilters;
  invalidationOptions?: InvalidateOptions;
};

export const useInvalidate = (): ((
  props: UseInvalidateProp,
) => Promise<void>) => {
  const { resources } = useResource();
  const queryClient = useQueryClient();
  const { keys, preferLegacyKeys } = useKeys();

  const invalidate = useCallback(
    async ({
      resource,
      dataProviderName,
      invalidates,
      id,
      invalidationFilters = { type: "all", refetchType: "active" },
      invalidationOptions = { cancelRefetch: false },
    }: UseInvalidateProp) => {
      if (invalidates === false) {
        return;
      }
      const dp = pickDataProvider(resource, dataProviderName, resources);

      const queryKey = keys()
        .data(dp)
        .resource(resource ?? "");

      await Promise.all(
        invalidates.map((key) => {
          switch (key) {
            case "all":
              return queryClient.invalidateQueries(
                {
                  ...invalidationFilters,
                  queryKey: keys().data(dp).get(preferLegacyKeys),
                },
                invalidationOptions,
              );
            case "list":
              return queryClient.invalidateQueries(
                {
                  ...invalidationFilters,
                  queryKey: queryKey.action("list").get(preferLegacyKeys),
                },
                invalidationOptions,
              );
            case "many":
              return queryClient.invalidateQueries(
                {
                  ...invalidationFilters,
                  queryKey: queryKey.action("many").get(preferLegacyKeys),
                },
                invalidationOptions,
              );
            case "resourceAll":
              return queryClient.invalidateQueries(
                {
                  ...invalidationFilters,
                  queryKey: queryKey.get(preferLegacyKeys),
                },
                invalidationOptions,
              );
            case "detail":
              return queryClient.invalidateQueries(
                {
                  ...invalidationFilters,
                  queryKey: queryKey
                    .action("one")
                    .id(id || "")
                    .get(preferLegacyKeys),
                },
                invalidationOptions,
              );
            default:
              return;
          }
        }),
      );

      return;
    },
    [],
  );

  return invalidate;
};
