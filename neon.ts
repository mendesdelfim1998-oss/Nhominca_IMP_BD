/**
 * Configuração de branches Neon.
 *
 * O pacote opcional `@neon/config` não está instalado neste projeto, por isso
 * exportamos a configuração diretamente com tipos locais. O `defineConfig()`
 * original é apenas uma função de identidade usada para inferência de tipos,
 * pelo que o objeto exportado é equivalente.
 */

interface NeonBranch {
  isDefault: boolean;
  exists: boolean;
}

interface NeonBranchConfig {
  /** Tempo de vida automático de branches temporários (ex.: "7d"). */
  ttl?: string;
}

interface NeonConfig {
  auth: boolean;
  branch: (branch: NeonBranch) => NeonBranchConfig;
}

const config: NeonConfig = {
  auth: false,
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: sem alterações, usa os parâmetros do projeto.
      return {};
    }
    if (!branch.exists) {
      // Novos branches não-default: expiração automática após 7 dias.
      // Criar com: `neon checkout <name>`
      return { ttl: '7d' };
    }
    // Branch existente: sem alterações.
    return {};
  },
};

export default config;
