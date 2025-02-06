import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Model } from './Model';
import { loadExternalResource } from '../loadExternalResource';

declare var loadlive2d: any;
declare var Live2D: any;
declare var data: any;

@Component({
	selector: 'app-waifu',
	templateUrl: './waifu.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrls: ['./waifu.component.css']
})
export class WaifuComponent implements OnInit {
	private intervalId: any;
	private isUserActive = false;

	private waifuTips = data.waifu.tips;
	public waifuTipsActive = true;
	public waifuTipMessage = '';
	private model = new Model(data.waifu.modelList, data.waifu.messages);
	public bottom = '-400px';

	constructor(private changeDetectorRef: ChangeDetectorRef) {
		changeDetectorRef.detach();
	}

	ngOnInit(): void {
		Promise.all([loadExternalResource('assets/js/live2d.min.js')]).then(() => {
			this.changeDetectorRef.detectChanges();
			this.loadWidget();
		}).then(() => {
			console.log(`
      く__,.ヘヽ.        /  ,ー､ 〉
         ＼ ', !-─‐-i  /  /´
         ／｀ｰ'       L/／｀ヽ､
       /   ／,   /|   ,   ,       ',
     ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
      ﾚ ﾍ 7ｲ｀ﾄ   ﾚ'ｧ-ﾄ､!ハ|   |
        !,/7 '0'     ´0iソ|    |
        |.从"    _     ,,,, / |./    |
        ﾚ'| i＞.､,,__  _,.イ /   .i   |
        ﾚ'| | / k_７_/ﾚ'ヽ,  ﾊ.  |
          | |/i 〈|/   i  ,.ﾍ |  i  |
         .|/ /  ｉ：    ﾍ!    ＼  |
          kヽ>､ﾊ    _,.ﾍ､    /､!
          !'〈//｀Ｔ´', ＼ ｀'7'ｰr'
          ﾚ'ヽL__|___i,___,ンﾚ|ノ
            ﾄ-,/  |___./
            'ｰ'    !_,.:
      `);
		}).catch((err) => {
			console.error(err);
		});
	}

	private displayMessage(tips: any[], duration: number, priority: number): void {
		const waifuText = sessionStorage.getItem('waifu-text');
		if (!tips || (waifuText && parseInt(waifuText) > priority)) return;

		if (this.intervalId) {
			clearTimeout(this.intervalId);
			this.intervalId = null;
		}
		sessionStorage.setItem('waifu-text', priority.toString());
		this.waifuTipsActive = true;
		this.waifuTipMessage = this.getRandomValue(tips);
		this.changeDetectorRef.detectChanges();

		this.intervalId = setTimeout(() => {
			sessionStorage.removeItem('waifu-text');
			this.waifuTipsActive = false;
			this.changeDetectorRef.detectChanges();
		}, duration);
	}

	private async loadModel(modelId: any, textureId: any, tips: any): Promise<void> {
		localStorage.setItem('modelId', modelId);
		localStorage.setItem('modelTexturesId', textureId);
		this.displayMessage(tips, 4000, 10);
		loadlive2d('live2d', this.model.get(parseInt(modelId), parseInt(textureId)));
	}

	private waifuTools: any = {
		'fa-comment': (event: any) => {
			event.preventDefault();
			fetch('https://api.quotable.io/random?maxLength=55').then(response => {
				response.json().then(data => {
					this.displayMessage([data.content], 6000, 9);
				});
			});
		},
		'fa-user-circle': (event: any) => {
			event.preventDefault();
			const modelId = localStorage.getItem('modelId');
			if (modelId) {
				const newModel = this.model.switch(parseInt(modelId));
				this.loadModel(newModel.modelID, 0, newModel.message).then(() => { });
			}
		},
		'fa-street-view': (event: any) => {
			event.preventDefault();
			const modelId = localStorage.getItem('modelId');
			const textureId = localStorage.getItem('modelTexturesId');
			if (modelId && textureId) {
				const newTextureID = this.model.randTexture(parseInt(modelId), parseInt(textureId));
				if (newTextureID === parseInt(textureId)) {
					this.displayMessage(['I don’t have any other clothes yet!'], 4000, 10);
				} else {
					this.loadModel(modelId, newTextureID, 'Does my new dress look good?').then(() => { });
				}
			}
		},
		'fa-camera-retro': (event: any) => {
			event.preventDefault();
			const modelId = localStorage.getItem('modelId');
			const textureId = localStorage.getItem('modelTexturesId');
			if (modelId && textureId) {
				this.displayMessage(['It’s taken, isn’t it cute?'], 6000, 9);
				Live2D.captureName = this.model.generateCaptureName(parseInt(modelId), parseInt(textureId));
				Live2D.captureFrame = true;
			}
		},
		'fa-info-circle': (event: any) => {
			event.preventDefault();
			open('https://github.com/JayantGoel001/JayantGoel001.github.io/');
		},
		'fa-times': (event: any) => {
			event.preventDefault();
			this.displayMessage(['May you meet important people again one day.'], 2000, 11);
			this.bottom = '-500px';
			this.changeDetectorRef.detectChanges();

			setTimeout(() => {
				document.getElementById('waifu')!.remove();
				this.changeDetectorRef.detectChanges();
			}, 2000);
		}
	};

	private windowEvent: any = {
		'mousemove': () => {
			this.isUserActive = true;
		},
		'keydown': () => {
			this.isUserActive = true;
		},
		'copy': () => {
			this.displayMessage(['What have you copied? Remember to add the source when reprinting!'], 6000, 9);
		},
		'visibilitychange': () => {
			if (document.hidden) {
				this.displayMessage(['Wow, you are finally back!'], 6000, 9);
			}
		}
	};

	public waifuToolsKeys = ['fa-comment', 'fa-user-circle', 'fa-street-view', 'fa-camera-retro', 'fa-info-circle', 'fa-times'];

	public getRandomValue(items: any[]): any {
		return Array.isArray(items) ? items[Math.floor(Math.random() * items.length)] : items;
	}

	private loadWidget(): void {
		localStorage.removeItem('waifu-display');
		sessionStorage.removeItem('waifu-text');

		this.bottom = '0';

		let idleInterval: any;
		const messages: string[] = [
			'Long time no see, life flies so fast...',
			'I wanted to know how long have you been ignoring people?',
			'Hi! Come and play with me!',
			'Hammer your chest with small fists!',
			'Remember to add StackOverflow to your bookmarks!'
		];

		for (const event in this.windowEvent) {
			window.addEventListener(event, this.windowEvent[event]);
		}

		setInterval(() => {
			if (this.isUserActive) {
				this.isUserActive = false;
				clearInterval(idleInterval);
				idleInterval = null;
			} else {
				if (!idleInterval) {
					idleInterval = setInterval(() => {
						this.displayMessage(this.getRandomValue(messages), 6000, 9);
					}, 20000);
				}
			}
		}, 1000);

		for (const tool in this.waifuTools) {
			document.querySelector(`#waifu-tool .${tool}`)!.addEventListener('click', this.waifuTools[tool]);
		}

	}

		let greeting: string | string[];
		if (location.pathname === '/') {
			const hour = new Date().getHours();
			 greeting = hour > 5 && hour <= 7 ? "Good morning! The plan for a day lies in the morning, and a beautiful day is about to begin." :
						hour > 7 && hour <= 11 ? "Good morning! Work well but don't sit for a long time just get up and move around!" :
						hour > 11 && hour <= 13 ? "It's noon, working all morning? Now it's lunch time!" :
						hour > 13 && hour <= 17 ? "It's easy to get sleepy in the afternoon. Have you achieved today's sports goal?" :
						hour > 17[_{ { {CITATION{ { {_1{](https://github.com/JianuoZhu/JianuoZhu.github.io/tree/20eab86abb30e4b1ff88330e7ee2ade2b61329d1/live2d-widget-master%2Fautoload.js)[_{{{CITATION{{{_2{](https://github.com/Nebulino/live2d-waifu/tree/179513031fcccfe392a4f8fc08fc69fa3ad358fc/autoload.js)[_{{{CITATION{{{_3{](https://github.com/maxiaoqu/vue-multi-template/tree/b94b65eed7600f6e6ba1dba355f5e800153a8b0d/console.js)



