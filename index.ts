/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";

const settings = definePluginSettings({
    refreshFrequency: {
        description: "Stream refreshing frequency (in seconds)",
                                      type: OptionType.SLIDER,
                                      markers: makeRange(30, 300, 30),
                                      default: 60,
                                          stickToMarkers: false,
                                          restartNeeded: true
    }
});

var streaming = false;

var userSettingId: number = 0;

export default definePlugin({
    name: "linuxStreamQualityFix",
    description: "refresh linux stream automatically",
    authors: [Devs.Caliswag],
    settings,

    patches: [
        {
            find: "}setDesktopEncodingOptions(",
                            replacement: {
                                match: /(setDesktopEncodingOptions\()(\i),(\i),(\i)(\){)/,
                                    replace: `$&\
                                    const repeat = async () => {\
                                        const sleep = (time) => new Promise(r => setTimeout(r, time));\
                                        const userSettingsId = $self.getUserSettingsId();\
                                        while ($self.isStreaming() && $self.getUserSettingsId() === userSettingsId) {\
                                            console.log("[StreamQualityDegredationFix] refreshing stream quality");\
                                            this.originalSetDesktopEncodingOptions(640,480,30);\
                                            this.originalSetDesktopEncodingOptions($2,$3,$4);\
                                            await sleep($self.getTimeoutDuration());\
                                        }\
                                    };\
                                    repeat();\
                                }\
                                originalSetDesktopEncodingOptions($2,$3,$4) {`
                                }
                            },
                            {
                                find: "},setGoLiveSource(",
                            replacement: {
                                match: /(setGoLiveSource\()(\i)(\){)(\(null==\i\?void 0:\i\.qualityOptions\)!=null)/,
                                    replace: "$1$2$3$self.setGoLiveSourceTrigger($2);$4"
                                }
                            }
    ],

    getTimeoutDuration() {
        const base = settings.store.refreshFrequency * 1000;
        const offset = (Math.random() * 10 - 5) * 1000; // offset by 5 seconds randomly
        return Math.max(1000, base + offset);
    },

    getUserSettingsId() {
        return userSettingId;
    },

    isStreaming() {
        return streaming;
    },

    setGoLiveSourceTrigger(options: any) {
        userSettingId++;
        if (!options || !Object.prototype.hasOwnProperty.call(options, "desktopSettings")) {
            streaming = false;
            return;
        }
        streaming = true;
    }
                            });
