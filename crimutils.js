/*
   This extension was made with DinoBuilder!
   https://dinobuilder.vercel.app/
*/
(async function(Scratch) {
    const variables = {};
    const blocks = [];
    const menus = {};


    if (!Scratch.extensions.unsandboxed) {
        alert("This extension needs to be unsandboxed to run!")
        return
    }

    function doSound(ab, cd, runtime) {
        const audioEngine = runtime.audioEngine;

        const fetchAsArrayBufferWithTimeout = (url) =>
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let timeout = setTimeout(() => {
                    xhr.abort();
                    reject(new Error("Timed out"));
                }, 5000);
                xhr.onload = () => {
                    clearTimeout(timeout);
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP error ${xhr.status} while fetching ${url}`));
                    }
                };
                xhr.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to request ${url}`));
                };
                xhr.responseType = "arraybuffer";
                xhr.open("GET", url);
                xhr.send();
            });

        const soundPlayerCache = new Map();

        const decodeSoundPlayer = async (url) => {
            const cached = soundPlayerCache.get(url);
            if (cached) {
                if (cached.sound) {
                    return cached.sound;
                }
                throw cached.error;
            }

            try {
                const arrayBuffer = await fetchAsArrayBufferWithTimeout(url);
                const soundPlayer = await audioEngine.decodeSoundPlayer({
                    data: {
                        buffer: arrayBuffer,
                    },
                });
                soundPlayerCache.set(url, {
                    sound: soundPlayer,
                    error: null,
                });
                return soundPlayer;
            } catch (e) {
                soundPlayerCache.set(url, {
                    sound: null,
                    error: e,
                });
                throw e;
            }
        };

        const playWithAudioEngine = async (url, target) => {
            const soundBank = target.sprite.soundBank;

            let soundPlayer;
            try {
                const originalSoundPlayer = await decodeSoundPlayer(url);
                soundPlayer = originalSoundPlayer.take();
            } catch (e) {
                console.warn(
                    "Could not fetch audio; falling back to primitive approach",
                    e
                );
                return false;
            }

            soundBank.addSoundPlayer(soundPlayer);
            await soundBank.playSound(target, soundPlayer.id);

            delete soundBank.soundPlayers[soundPlayer.id];
            soundBank.playerTargets.delete(soundPlayer.id);
            soundBank.soundEffects.delete(soundPlayer.id);

            return true;
        };

        const playWithAudioElement = (url, target) =>
            new Promise((resolve, reject) => {
                const mediaElement = new Audio(url);

                mediaElement.volume = target.volume / 100;

                mediaElement.onended = () => {
                    resolve();
                };
                mediaElement
                    .play()
                    .then(() => {
                        // Wait for onended
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

        const playSound = async (url, target) => {
            try {
                if (!(await Scratch.canFetch(url))) {
                    throw new Error(`Permission to fetch ${url} denied`);
                }

                const success = await playWithAudioEngine(url, target);
                if (!success) {
                    return await playWithAudioElement(url, target);
                }
            } catch (e) {
                console.warn(`All attempts to play ${url} failed`, e);
            }
        };

        playSound(ab, cd)
    }

    const ExtForge_Utils = {
        // from https://jwklong.github.io/extforge
        Broadcasts: new function() {
            this.raw_ = {};
            this.register = (name, blocks) => {
                this.raw_[name] = blocks;
            };
            this.execute = async (name) => {
                if (this.raw_[name]) {
                    await this.raw_[name]();
                };
            };
        }
    }
    class Extension {
        getInfo() {
            return {
                "menuIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAYAAADhu0ooAAADnklEQVR4nO2Z3VUTQRSA7wTfjRWoFSRWYKyAWIFQgeEIj8AKj+AhVABWYFKBSwUkFaAVCO/C+A0mx7DLzN6JuyGBfOdc7gT2537Z3ZmbYOSJsBR9bCxFy+Bwx36wIh2x0uSlHyMDCulu7pmvvKoEQ1TC4bY9QXJNIqCY0819s86wdAxROgc7NuEq7jKMx8jnrT2TSMlUI7ptf5HqxDRcbu2bF+RSKV30ILEtuZbvDCcZcqYeOY+VNj8bxD9W5N1WYlIpkdmIBgqP3X5alqLTElt47PbTEhQ9Smz994185DlqiRbDJJRdN1kn+d0lozyx29+HkfRZTY43EuPdxyt6K3ktFwzrxCJw+WxFXvtkvaJ0NV1ruZoLhDFyTHfVYZjDK8pamIrIW2KR6LMGt8k5QqId0hGxSGwg2iXn8Io6kE1lca7qGZIt8RAUdXzZtms3IicM55aayPqnfXMqAQpFHVxZS5pbuJKFHoUbOJ6S6IDUIOaRIaJNchCtaCq6SemKSGjhBnIjLbqbXV5PcsbfEnFcS5efd988PovywKX8rcmrRESeE0UEJ6ExWtEeaZUIUstMCpmm44rO5dW4cxl1Xj9kJMPNd2ex55xufEQU0Ue0TQ6iE9V+Y5Bpxg+SOw177p1HJpXxnRLe1w93geYbiaXoJIeJbdtr+cYwTLjYSkTNirzfTEyPYRCVqPakBcVWIprdz4dKlImjycRxzjBM5qSZYisRZYJ7wwQ3YBhEJeqgKEsKEy62ElGOqXJQbeSgKEsKEy52YUTd7dEg/ISLrUJ0yDGb5EJiRFMZF+UjXGwVorlj+ogR7ZFWCT/hYnNFccxU/k+0zzHb5EL0opqmIVxs+aLKZsGxFM2i6o7CxZYuqu2KHGpRzYkLii1dNLtPCLWoqjvKnDhTbOmi2q7IoRZ1UJgl+QkXW7oox1PXr97QQWGW5KXgg/edfxlwh9S5Qy4Y1oncB2/Nt49Vig5IDcLHJafu2Jr8NDfSQLLL7yZJV/5+RcLFus0tmWC075B9X472rRM+hog2ySpiRVMZ32oPT+5RCBEr2iOtEvNAH9E2WUWcqKZpmBURzYJjKXofqu5oRsR0RY4oUc3aNjMy624RUaKsfU3WvnOGDw5rsrorckSJOph5LenBYcaNqj1qYweiqTz8Whq1hjriRZM5eE4jn09HtKhD04dWRS3TT2uZStQxurIdhqvELOhzJbuxV3LM1KKLxlL0sfFkRP8A1F+QWUqFQlYAAAAASUVORK5CYII=",
                "id": "crimutils",
                "name": "Crimson Yes Good Extension",
                "color1": "#8080c0",
                "color2": "#5353a6",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        blockType: Scratch.BlockType.LABEL,
        hideFromPalette: false,
        text: `JS things`,
    });


    blocks.push({
        opcode: `doJS`,
        blockType: Scratch.BlockType.COMMAND,
        hideFromPalette: false,
        text: `do javascript [JS]`,
        arguments: {
            "JS": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "do the js",
            },
        },
        disableMonitor: true
    });
    Extension.prototype[`doJS`] = async (args, util) => {
        eval(args["JS"])
        // It does the js wowie
    };

    blocks.push({
        blockType: Scratch.BlockType.LABEL,
        hideFromPalette: false,
        text: `Timer things`,
    });


    blocks.push({
        opcode: `pauseTimer`,
        blockType: Scratch.BlockType.COMMAND,
        hideFromPalette: false,
        text: `pause timer`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`pauseTimer`] = async (args, util) => {
        Scratch.vm.runtime.ioDevices.clock.pause();
    };

    blocks.push({
        opcode: `resumeTimer`,
        blockType: Scratch.BlockType.COMMAND,
        hideFromPalette: false,
        text: `resume timer`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`resumeTimer`] = async (args, util) => {
        Scratch.vm.runtime.ioDevices.clock.resume();
    };

    blocks.push({
        blockType: Scratch.BlockType.LABEL,
        hideFromPalette: false,
        text: `Cool booleans`,
    });


    blocks.push({
        opcode: `ifNotThing`,
        blockType: Scratch.BlockType.BOOLEAN,
        hideFromPalette: false,
        text: `if [thisthing] then not [thatthing]`,
        arguments: {
            "thisthing": {
                type: Scratch.ArgumentType.BOOLEAN,
            },
            "thatthing": {
                type: Scratch.ArgumentType.BOOLEAN,
            },
        },
        disableMonitor: false
    });
    Extension.prototype[`ifNotThing`] = async (args, util) => {
        if ((args["thisthing"] == true)) {
            return !args["thatthing"]
        } else {
            return args["thatthing"]
        };
    };

    Scratch.extensions.register(new Extension());
})(Scratch);
