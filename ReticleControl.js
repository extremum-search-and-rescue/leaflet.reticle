var L;
(function (L) {
    class RecticleControlOptions {
        constructor() {
            this.position = 'absolute';
        }
    }
    L.RecticleControlOptions = RecticleControlOptions;
    class ReticleControl extends L.Control {
        constructor(options) {
            options = Object.assign(Object.assign({}, new L.RecticleControlOptions()), options);
            super(options);
            this.isVisible = false;
        }
        onAdd(map) {
            this._map = map;
            map.reticleControl = this;
            map.on('themechanged', this._updateReticle, this);
            map.on('moveend', this._updateReticleDelayed, this);
            map.on('zoomend', this._updateReticleDelayed, this);
            map.on('overlayadd', this.show, this);
            map.on('overlayremove', this.hide, this);
            map.on('resize', this._updateReticleDelayed, this);
            if (map.hasLayer(suncalc))
                this.isVisible = true;
            this._container = L.DomUtil.create('div', 'reticle-control');
            this._container.style.top = '50%';
            this._container.style.left = '50%';
            this._container.style.transform = 'translate(-50%,-50%)';
            this._container.style.position = 'absolute';
            map.whenReady(this._updateReticle, this);
            return this._container;
        }
        show(e) {
            if (e.layer && e.layer.options && e.layer.options.id === 'SC') {
                this.isVisible = true;
                this._updateReticle();
                this._container.style.visibility = 'visible';
            }
            ;
        }
        hide(e) {
            if (e.layer && e.layer.options && e.layer.options.id === 'SC') {
                this.isVisible = false;
                this._container.innerHTML = '';
            }
        }
        _updateReticleDelayed() {
            if (!this.isVisible)
                return;
            const self = this;
            setTimeout(() => L.ReticleControl.prototype._updateReticle.call(self), 50);
        }
        _updateReticle(context) {
            const self = this || context;
            if (!self._map.hasLayer(suncalc))
                return;
            const halfSize = 200;
            const theme = `gis-theme-${self._map.options.baseLayerTheme}`;
            const _HALF = 1 / 2;
            const _QUARTER = 1 / 4;
            const _THREE_QUARTERS = 3 / 4;
            function _getScaleRatioLabel(maxDist) {
                let roundDist, unitStr;
                if (maxDist > 1000) {
                    maxDist = maxDist / 1000;
                    roundDist = _getRoundNum(maxDist);
                    unitStr = `км`;
                }
                else {
                    roundDist = _getRoundNum(maxDist);
                    unitStr = `м`;
                }
                return [roundDist / maxDist, `${roundDist} ${unitStr}`];
            }
            function getRect(xStart, yStart, width, height) {
                return `<rect class="gis-themeaware reticle ${theme}" x=${xStart} y="${yStart}" width="${width}" height="${height}"></rect>`;
            }
            function _calculateMaxDistance(xS, yS, xE, yE) {
                return self._map.distance(self._map.containerPointToLatLng([xS, yS]), self._map.containerPointToLatLng([xE, yE]));
            }
            function _getRoundNum(num) {
                let pow10 = Math.pow(10, `${Math.floor(num)}`.length - 1);
                let d = num / pow10;
                d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
                return pow10 * d;
            }
            const mapSize = self._map.getSize();
            const mapWidthFromCenter = mapSize.x / 2;
            const mapHeightFromCenter = mapSize.y / 2;
            const maxReticleWidth = Math.min(220, halfSize - 20);
            const maxReticleHeight = Math.min(200, halfSize - 30);
            const maxWidthDist = _calculateMaxDistance(mapWidthFromCenter, mapHeightFromCenter, mapWidthFromCenter + maxReticleWidth, mapHeightFromCenter);
            const maxHeightDist = _calculateMaxDistance(mapWidthFromCenter, mapHeightFromCenter, mapWidthFromCenter, mapHeightFromCenter + maxReticleHeight);
            const widthDiff = Math.abs(self._previousWidthDist - maxWidthDist);
            const heightDiff = Math.abs(self._previousHeightDist - maxHeightDist);
            if (widthDiff >= 1 || heightDiff >= 1)
                self._previousWidthDist = maxWidthDist;
            self._previousHeightDist = maxHeightDist;
            const [widthRatio, widthText] = _getScaleRatioLabel(maxWidthDist);
            const [heightRatio, heightText] = _getScaleRatioLabel(maxHeightDist);
            const widthLabel = `<text class="gis-themeaware reticle-text ${theme}" x="${halfSize + widthRatio * maxReticleWidth - 16}" y="${halfSize - 4}">${widthText}</text>`;
            const heightLabel = `<text class="gis-themeaware reticle-text ${theme}" x="${halfSize - 8}" y="${halfSize + heightRatio * maxReticleHeight + 12}">${heightText}</text>`;
            function _widthTicks(ratio, tickHeightRatio) {
                tickHeightRatio = tickHeightRatio ? tickHeightRatio : 1;
                return `${getRect(halfSize - 2 + widthRatio * maxReticleWidth * ratio, halfSize, 2, 8 * tickHeightRatio)}`;
            }
            function _heightTicks(ratio, tickWidthRatio) {
                tickWidthRatio = tickWidthRatio ? tickWidthRatio : 1;
                return `${getRect(halfSize, halfSize - 2 + heightRatio * maxReticleHeight * ratio, 8 * tickWidthRatio, 2)}`;
            }
            const widthTicks = [_widthTicks(_QUARTER, 0.5), _widthTicks(_HALF), _widthTicks(_THREE_QUARTERS, 0.5), _widthTicks(1)].join('');
            const heightTicks = [_heightTicks(_QUARTER, 0.5), _heightTicks(_HALF), _heightTicks(_THREE_QUARTERS, 0.5), _heightTicks(1)].join('');
            const crosshair = `<svg xmlns="http://www.w3.org/2000/svg" width="${halfSize * 2}" height="${halfSize * 2}" viewbox="0 0 ${halfSize * 2} ${halfSize * 2}"><rect class="gis-themeaware reticle ${theme}" x="${halfSize - 1}" y="${halfSize + 8}" width="2" height="${heightRatio * maxReticleHeight - 8}"/>${heightTicks}${heightLabel}<rect class="gis-themeaware reticle ${theme}" x="${halfSize + 8}" y="${halfSize - 1}" width="${widthRatio * maxReticleWidth - 8}" height="2" />${widthTicks}${widthLabel}</svg>`;
            self._container.innerHTML = crosshair;
        }
    }
    L.ReticleControl = ReticleControl;
    ;
    let control;
    (function (control) {
        function reticle(opts) {
            return new L.ReticleControl(opts);
        }
        control.reticle = reticle;
    })(control = L.control || (L.control = {}));
})(L || (L = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmV0aWNsZUNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJSZXRpY2xlQ29udHJvbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFVLENBQUMsQ0E2SVY7QUE3SUQsV0FBVSxDQUFDO0lBSVAsTUFBYSxzQkFBc0I7UUFBbkM7WUFDSSxhQUFRLEdBQXNCLFVBQVUsQ0FBQTtRQUM1QyxDQUFDO0tBQUE7SUFGWSx3QkFBc0IseUJBRWxDLENBQUE7SUFDRCxNQUFhLGNBQWUsU0FBUSxDQUFDLENBQUMsT0FBTztRQU16QyxZQUFZLE9BQWtDO1lBQzFDLE9BQU8sbUNBQVEsSUFBSSxDQUFDLENBQUMsc0JBQXNCLEVBQUUsR0FBSyxPQUFPLENBQUMsQ0FBQTtZQUMxRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFObkIsY0FBUyxHQUFZLEtBQUssQ0FBQTtRQU8xQixDQUFDO1FBQ1EsS0FBSyxDQUFFLEdBQVU7WUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7WUFDaEIsR0FBRyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDMUIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxHQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDcEQsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BELEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN6QyxHQUFHLENBQUMsRUFBRSxDQUFDLFFB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