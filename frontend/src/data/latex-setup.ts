export type LatexStep = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  commands?: string[];
};

/**
 * Install paths copied from the vendor pages linked on each step.
 * Ubuntu on the Microsoft Store is currently the 24.04 LTS line (noble).
 */
export const latexSetup: LatexStep[] = [
  {
    title: "Ubuntu from the Microsoft Store, on WSL",
    body: "On Windows 10 version 2004 (Build 19041) or later, or Windows 11, install Windows Subsystem for Linux from an administrator PowerShell. That command installs Ubuntu by default. You can also open the Microsoft Store, search for Ubuntu, and choose Get. Canonical’s current Store listing is Ubuntu 24.04 LTS.",
    href: "https://learn.microsoft.com/en-us/windows/wsl/install",
    hrefLabel: "Microsoft: Install WSL",
    commands: ["wsl --install"],
  },
  {
    title: "MiKTeX inside that Ubuntu",
    body: "MiKTeX’s Linux instructions register its signed package repository, then install the miktex package. Ubuntu 24.04 from the Store uses the noble line. The same page lists jammy for Ubuntu 22.04 and resolute for Ubuntu 26.04. Finish setup with miktexsetup. MiKTeX does not ship Perl; LaTeX Workshop’s default latexmk build needs Perl, as its install guide notes.",
    href: "https://miktex.org/download",
    hrefLabel: "MiKTeX: Getting MiKTeX",
    commands: [
      "curl -fsSL https://miktex.org/download/key | sudo gpg --dearmor -o /usr/share/keyrings/miktex.gpg",
      'echo "deb [signed-by=/usr/share/keyrings/miktex.gpg] https://miktex.org/download/ubuntu noble universe" | sudo tee /etc/apt/sources.list.d/miktex.list',
      "sudo apt-get update",
      "sudo apt-get install miktex",
      "miktexsetup finish",
    ],
  },
  {
    title: "VS Code and the LaTeX extension",
    body: "Install Visual Studio Code, then open a project in the Ubuntu environment with the Remote - WSL workflow so the editor can see MiKTeX. In VS Code Quick Open (Ctrl+P), install LaTeX Workshop with the command from its install guide.",
    href: "https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop",
    hrefLabel: "LaTeX Workshop on the Marketplace",
    commands: ["ext install latex-workshop"],
  },
  {
    title: "Optional: Claude Code for VS Code",
    body: "Anthropic’s Claude Code extension adds a chat and edit UI inside VS Code. From Quick Open, run the Marketplace install command, or search for Claude Code and install the Anthropic extension.",
    href: "https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code",
    hrefLabel: "Claude Code for VS Code",
    commands: ["ext install anthropic.claude-code"],
  },
  {
    title: "Optional: GUI for Grok Build and Muse Code",
    body: "The Marketplace extension “GUI for Grok Build & Muse Code” is a sidebar for the Grok Build CLI and Muse Code. Its listing says to open Extensions and search for that name. The extension then walks through installing the grok CLI and signing in. It is a third-party extension, not published by xAI.",
    href: "https://marketplace.visualstudio.com/items?itemName=PawelHuryn.grok-vscode-phuryn",
    hrefLabel: "GUI for Grok Build & Muse Code",
  },
];
