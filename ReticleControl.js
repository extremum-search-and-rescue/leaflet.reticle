L.ReticleControl = L.Control.extend({
    options: {
        position: 'middlecenter'
    },
    _self: this,
    _map: null,
    isVisible: false,
    _container: null,
    _previousWidthDist: null,
    _previousHeightDist: null,
    onAdd: function (map) {
        this._map = map;
        map.reticleControl = this;
        map.on('themechanged', this._updateReticle, this);
        map.on('moveend', this._updateReticleDelayed, this);
        map.on('zoomend', this._updateReticleDelayed, this);
        map.on('overlayadd', this.show, this);
        map.on('overlayremove', this.hide, this);
        map.on('resize', this._updateReticleDelayed, this);
        if (map.hasLayer(suncalc)) this.isVisible = true;
        this._container = _container = L.DomUtil.create('div', 'reticle-control');
        _container.style.top = '50%';
        _container.style.left = '50%';
        _container.style.transform = 'translate(-50%,-50%)';
        _container.style.position = 'absolute';
        map.whenReady(this._updateReticle, this);
        return _container;
    },
    onRemove: function (map) { },
    show: function(e) {
        if (e.layer && e.layer.options && e.layer.options.id === 'SC') {
            this.isVisible = true;
            this._updateReticle();
            this._container.style.visibility = 'visible';
        };
    },
    hide: function(e) {
        if (e.layer && e.layer.options && e.layer.options.id === 'SC') {
            this.isVisible = false;
            this._container.innerHTML = '';
        }
    },
    _updateReticleDelayed: function () {
        if (!this.isVisible) return;
        setTimeout(() => this._updateReticle(), 50);
    },
    _updateReticle: function () {
        if (!this._map.hasLayer(suncalc)) return;

        const halfSize = 200;
        const theme = `gis-theme-${this._map.options.baseLayerTheme}`;
        const _HALF = 1 / 2;
        const _QUARTER = 1 / 4;
        const _THREE_QUARTERS = 3 / 4;
        function _getScaleRatioLabel(maxDist) {
            let roundDist, unitStr;
            if (maxDist > 1000) {
                maxDist = maxDist / 1000;
                roundDist = _getRoundNum(maxDist);
                unitStr = `км`;
            } else {
                roundDist = _getRoundNum(maxDist);
                unitStr = `м`;
            }
            return [roundDist / maxDist, `${roundDist} ${unitStr}`];
        }
        function getRect(xStart, yStart, width, height) {
            return `<rect class="gis-themeaware reticle ${theme}" x=${xStart} y="${yStart}" width="${width}" height="${height}"></rect>`;
        }
        function _calculateMaxDistance(xS, yS, xE, yE) {
            return map.distance(
                map.containerPointToLatLng([xS, yS]),
                map.containerPointToLatLng([xE, yE])
            );
        }

        function _getRoundNum(num) {
            let pow10 = Math.pow(10, `${Math.floor(num)}`.length - 1);
            let d = num / pow10;
            d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
            return pow10 * d;
        }

        let mapSize = map.getSize();
        let mapWidthFromCenter = mapSize.x / 2;
        let mapHeightFromCenter = mapSize.y / 2;

        const maxReticleWidth = Math.min(220, halfSize - 20);
        const maxReticleHeight = Math.min(200, halfSize - 30);
        const maxWidthDist = _calculateMaxDistance(
            mapWidthFromCenter,
            mapHeightFromCenter,
            mapWidthFromCenter + maxReticleWidth,
            mapHeightFromCenter
        );

        const maxHeightDist = _calculateMaxDistance(
            mapWidthFromCenter,
            mapHeightFromCenter,
            mapWidthFromCenter,
            mapHeightFromCenter + maxReticleHeight
        );
        const widthDiff = Math.abs(this._previousWidthDist - maxWidthDist);
        const heightDiff = Math.abs(this._previousHeightDist - maxHeightDist);
        if (widthDiff >= 1 || heightDiff >= 1)
        this._previousWidthDist = maxWidthDist;
        this._previousHeightDist = maxHeightDist;

        let [widthRatio, widthText] = _getScaleRatioLabel(maxWidthDist);
        let [heightRatio, heightText] = _getScaleRatioLabel(maxHeightDist);
        const widthLabel = `<text class="gis-themeaware reticle-text ${theme}" x="${halfSize + widthRatio * maxReticleWidth - 16}" y="${halfSize - 4}">${widthText}</text>`;
        const heightLabel = `<text class="gis-themeaware reticle-text ${theme}" x="${halfSize - 8}" y="${halfSize + heightRatio * maxReticleHeight + 12}">${heightText}</text>`;

        function _widthTicks(ratio, tickHeightRatio) {
            tickHeightRatio = tickHeightRatio ? tickHeightRatio : 1;
            return `${getRect(halfSize - 2 + widthRatio * maxReticleWidth * ratio, halfSize, 2, 8 * tickHeightRatio)}`
        }
        function _heightTicks(ratio, tickWidthRatio) {
            tickWidthRatio = tickWidthRatio ? tickWidthRatio : 1;
            return `${getRect(halfSize, halfSize - 2 + heightRatio * maxReticleHeight * ratio, 8 * tickWidthRatio, 2)}`
        }
        const widthTicks = [_widthTicks(_QUARTER, 0.5), _widthTicks(_HALF), _widthTicks(_THREE_QUARTERS, 0.5), _widthTicks(1)].join('');
        const heightTicks = [_heightTicks(_QUARTER, 0.5), _heightTicks(_HALF), _heightTicks(_THREE_QUARTERS, 0.5), _heightTicks(1)].join('');
        const crosshair = `<svg xmlns="http://www.w3.org/2000/svg" width="${halfSize * 2}" height="${halfSize * 2}" viewbox="0 0 ${halfSize * 2} ${halfSize * 2}"><rect class="gis-themeaware reticle ${theme}" x="${halfSize - 1}" y="${halfSize + 8}" width="2" height="${heightRatio * maxReticleHeight - 8}"/>${heightTicks}${heightLabel}<rect class="gis-themeaware reticle ${theme}" x="${halfSize + 8}" y="${halfSize - 1}" width="${widthRatio * maxReticleWidth - 8}" height="2" />${widthTicks}${widthLabel}</svg>`;
        this._container.innerHTML = crosshair;
    },
});

L.control.reticle = function(opts) {
    return new L.ReticleControl(opts);
}