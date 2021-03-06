import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import { MainAreaWidget } from "@jupyterlab/apputils";

import { ILauncher } from "@jupyterlab/launcher";

import { reactIcon } from "@jupyterlab/ui-components";

import { AudioVisualizerJupyter } from "./widget";

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
  export const create = "create-react-widget";
}

/**
 * Initialization data for the react-widget extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: "audio-visualizer-widget",
  autoStart: true,
  optional: [ILauncher],
  activate: (app: JupyterFrontEnd, launcher: ILauncher) => {
    const { commands } = app;

    const command = CommandIDs.create;
    commands.addCommand(command, {
      caption: "Create a new Audio Visualizer React Widget",
      label: "Audio Visualizer",
      icon: (args) => (args["isPalette"] ? null : reactIcon),
      execute: () => {
        const content = new AudioVisualizerJupyter();
        const widget = new MainAreaWidget<AudioVisualizerJupyter>({ content });
        widget.title.label = "Audio Visualizer";
        app.shell.add(widget, "main");
      },
    });

    if (launcher) {
      launcher.add({
        command,
      });
    }
  },
};

export default extension;
