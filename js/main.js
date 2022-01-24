window.droppedURL = '';
window.filters = [];
window.selectedFilter = '';
const fieldImage = document.querySelector('[name="image"]');
const btnDownload = document.querySelector('#download');
const btnUpload = document.querySelector('#uploadFile');

/**
 *
 * @param {Image} img
 */
const startDraw = (img) => {
    // first we need to create a stage
    const stage = new Konva.Stage({
        container: 'container', // id of container <div>
        width: 600,
        height: 335,
    });
    const container = stage.container();

    // then create layer
    const layer = new Konva.Layer();

    // buat objek gambar
    const image = new Konva.Image({
        image: img,
        width: stage.width(),
        height: (img.height / img.width) * stage.width(),
    });

    const updateTransformer = () => {
        if (window.selectedFilter == '') {
            transformer.nodes([]);
        } else {
            const selectedNode = window.filters.find((filter) => filter.name() === window.selectedFilter);
            if (selectedNode === transformer.node()) return;
            transformer.nodes([selectedNode]);
        }
    };

    // tambah gambar ke layer
    layer.add(image);

    // transformer
    const transformer = new Konva.Transformer();
    layer.add(transformer);

    stage.on('mousedown', (ev) => {
        if (ev.target === ev.target.getStage()) {
            window.selectedFilter = '';
            updateTransformer();
            return;
        }

        // if cliecked on transformer
        if (ev.target.getParent().getClassName() === 'Transformer') {
            return;
        }

        // if clicked on filter
        const name = ev.target.name();
        const image = window.filters.find((filter) => filter.name() === name);
        if (image) window.selectedFilter = name;
        else window.selectedFilter = '';
        updateTransformer();
    });

    container.addEventListener('dragover', (ev) => ev.preventDefault());
    container.addEventListener('drop', (ev) => {
        ev.preventDefault();

        stage.setPointersPositions(ev);
        Konva.Image.fromURL(window.droppedURL, (image) => {
            image.setAttrs({
                width: 200,
                height: (image.height() / image.width()) * 200,
            });
            image.draggable(true);
            image.position(stage.getPointerPosition());
            image.addName(Date.now());

            layer.add(image);

            window.filters.push(image);
            window.selectedFilter = image.name();
            transformer.nodes([image]);
        });
    });
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Delete') {
            if (window.selectedFilter != '') {
                const image = window.filters.find((filter) => filter.name() === window.selectedFilter);
                if (image) image.destroy();
            }
        }
    });

    // tambah layer ke stage
    stage.add(layer);

    function downloadURI(uri, name) {
        var link = document.createElement('a');
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        delete link;
      }

    btnDownload.addEventListener('click', ev => {
        ev.preventDefault();
        const dataURL = stage.toDataURL({pixelRatio: 3});
        downloadURI(dataURL, `gambar_${Date.now()}.png`);
    });
};



// print filter
const imageFilters = ['kacamata1.png', 'janggut.png', 'bw_cat.png', 'cat.png', 'dog.png', 'face1.png', 'rabbit.png'];

document.querySelector('#filters').innerHTML = (() => {
    let html = '';
    imageFilters.forEach((filter) => {
        html += `<div class="border border-gray-200 flex items-center justify-center p-4"><img src="filters/${filter}" alt="${filter}" class="w-full" draggable="true" /></div>`;
    });
    return html;
})();

document.querySelectorAll('#filters img').forEach((img) => {
    img.addEventListener('dragstart', (ev) => {
        console.log(ev.target);
        window.droppedURL = ev.target.src;
    });
});

btnUpload.addEventListener('click', (ev) => {
    ev.preventDefault();
    fieldImage.click();
});

fieldImage.addEventListener('change', (ev) => {
    if (ev.target.files.length > 0) {
        const url = URL.createObjectURL(ev.target.files[0]);
        const img = new Image();
        img.src = url;
        img.onload = function () {
            startDraw(this);
            document.querySelector('#container').removeAttribute('class');
            btnUpload.classList.add('hidden');
            btnDownload.parentNode.classList.remove('hidden');
        };
    }
});
