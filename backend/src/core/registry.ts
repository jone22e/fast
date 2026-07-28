import type { AuditPlugin } from './types.js';

/**
 * Registro de plugins. O núcleo não importa plugins diretamente —
 * eles se registram aqui, tornando a plataforma extensível sem tocar no engine.
 */
const plugins = new Map<string, AuditPlugin>();

export function registerPlugin(plugin: AuditPlugin): void {
  if (plugins.has(plugin.id)) {
    throw new Error(`Plugin duplicado: ${plugin.id}`);
  }
  plugins.set(plugin.id, plugin);
}

export function getPlugins(): AuditPlugin[] {
  return [...plugins.values()];
}

export function getPlugin(id: string): AuditPlugin | undefined {
  return plugins.get(id);
}

export function clearPlugins(): void {
  plugins.clear();
}
