import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { catalogRepository, config } from '@/data';
import { Catalog } from '@/data/repository';
import { Product } from '@/domain/types';

type Status = 'loading' | 'ready' | 'error';
interface Api { status: Status; products: Product[]; byId(id: string): Product | undefined; threshold: number; reload(): void }
const Ctx = createContext<Api | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const load = useCallback(() => {
    setStatus('loading');
    catalogRepository.getCatalog().then((c) => { setCatalog(c); setStatus('ready'); }).catch(() => setStatus('error'));
  }, []);
  useEffect(load, [load]);
  const api = useMemo<Api>(() => {
    const products = catalog?.products ?? [];
    const map = new Map(products.map((p) => [p.id, p]));
    return { status, products, byId: (id) => map.get(id), threshold: catalog?.freeShippingThreshold ?? config.freeShippingThreshold, reload: load };
  }, [status, catalog, load]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useCatalog(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCatalog outside CatalogProvider');
  return v;
}
