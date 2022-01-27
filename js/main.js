window.droppedURL = '';
window.filters = [];
window.selectedFilter = '';
const fieldImage = document.querySelector('[name="image"]');
const btnDownload = document.querySelector('#download');
const btnUpload = document.querySelector('#uploadFile');
const btnDelete = document.querySelector('#delete');

/**
 *
 * @param {Image} img
 */
const startDraw = (img) => {
    const pixelRatio = img.width / 600;

    Konva.pixelRatio = pixelRatio;

    // Membuat stage
    const stage = new Konva.Stage({
        container: 'container', // id of container <div>
        width: 600,
        height: (img.height / img.width) * 600, // atur tinggi container menyesuaikan dengan tinggi gambar
    });

    const container = stage.container();

    // membuat layer
    const layer = new Konva.Layer();

    // buat objek gambar dari paramter img
    const image = new Konva.Image({
        image: img,
        width: stage.width(),
        height: stage.height(),
    });

    image.cache();
    image.filters([Konva.Filters.HSL, Konva.Filters.Brighten, Konva.Filters.Contrast]);
    
    // slider
    const sliders = ['hue', 'saturation', 'luminance', 'brightness', 'contrast'];
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const update = () => {
            image[id](parseFloat(slider.value));
            document.querySelector('span.' + id + '-value').innerText = parseFloat(slider.value);
        };
        slider.addEventListener('input', update);
        // update();
    })

    // update transformer
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

    // tambahkan transformer ke dalam layer
    layer.add(transformer);

    // deteksi klik pada transformer
    // mengaktifkan transformer pada suatu gambar
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

    // pengaturan event untuk drag dan drop filter
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

    // hapus filter pada canvas
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
            if (window.selectedFilter != '') {
                const image = window.filters.find((filter) => filter.name() === window.selectedFilter);
                if (image) {
                    image.destroy();
                    window.selectedFilter = '';
                    updateTransformer();
                }                
            }
        }
    });

    // tambah layer ke stage
    stage.add(layer);

    // fungsi download
    function downloadURI(uri, name) {
        var link = document.createElement('a');
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        delete link;
      }

    // deteksi klik pada tombol unduh
    // ketika klik, jalankan fungsi download
    const eventDownload = (ev) => {
        ev.preventDefault();
        const dataURL = stage.toDataURL({pixelRatio: pixelRatio});
        downloadURI(dataURL, `gambar_${Date.now()}.png`);
    }

    const eventDelete = (ev) => {
        ev.preventDefault();
        
        if(confirm('Yakin akan menghapus gambar?')) {
            stage.destroy();
            // hide canvas
            document.querySelector('#container').classList.add('hidden');

            // tampilkan tombol unggah
            btnUpload.classList.remove('hidden');

            // sembunyikan tombol unduh
            btnDownload.parentNode.classList.add('hidden');

            btnDelete.removeEventListener('click', eventDelete);
            btnDownload.removeEventListener('click', eventDownload);
        }
    }

    btnDownload.addEventListener('click', eventDownload);

    btnDelete.addEventListener('click', eventDelete);
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

// aktifkan event drag dan drop pada filter
document.querySelectorAll('#filters img').forEach((img) => {
    img.addEventListener('dragstart', (ev) => {
        console.log(ev.target);
        window.droppedURL = ev.target.src;
    });
});

// event untuk unggah gambar
btnUpload.addEventListener('click', (ev) => {
    ev.preventDefault();
    // buka field input type file
    fieldImage.click();
});

// event ketika pengguna mengunggah gambar
fieldImage.addEventListener('change', (ev) => {
    if (ev.target.files.length > 0) {
        const url = URL.createObjectURL(ev.target.files[0]);
        const img = new Image();
        img.src = url;
        img.onload = function () {
            // jalankan canvas
            startDraw(this);

            // visible-kan canvas
            document.querySelector('#container').removeAttribute('class');

            // sembunyikan tombol unggah
            btnUpload.classList.add('hidden');

            // tampilkan tombol unduh
            btnDownload.parentNode.classList.remove('hidden');

            ev.target.value = '';
        };
    }
});
