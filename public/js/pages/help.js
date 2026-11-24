import { manualContent } from '../data/manual-content.js';

const mount = document.getElementById('interactive-manual');

if (mount) {
    const sections = manualContent.sections;
    const expanded = new Set([sections[0]?.id]);
    let query = '';

    const escapeHtml = (value) =>
        String(value).replace(/[&<>'"]/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;',
        })[char]);

    const normalize = (value) =>
        value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();

    const blockText = (block) => {
        switch (block.type) {
            case 'subsection':
                return [block.title, ...block.blocks.map(blockText)].join(' ');
            case 'image':
                return block.caption;
            case 'note':
                return `nota ${block.text}`;
            default:
                return block.text;
        }
    };

    const filterBlocks = (blocks, search) =>
        blocks.reduce((acc, block) => {
            if (block.type === 'subsection') {
                const children = filterBlocks(block.blocks, search);
                if (normalize(block.title).includes(search) || children.length > 0) {
                    acc.push({ ...block, blocks: normalize(block.title).includes(search) ? block.blocks : children });
                }
                return acc;
            }
            if (normalize(blockText(block)).includes(search)) acc.push(block);
            return acc;
        }, []);

    const renderBlock = (block) => {
        const text = escapeHtml(block.text);
        switch (block.type) {
            case 'title':
                return `<h3 class='text-2xl font-bold text-gray-900 mb-2'>${text}</h3>`;
            case 'heading':
                return `<h4 class='text-base font-bold text-pink-600 mt-4 mb-2'>${text}</h4>`;
            case 'paragraph':
                return `<p class='text-sm leading-7 text-gray-700 mb-3'>${text}</p>`;
            case 'bullet':
                return `<div class='flex gap-2 mb-2 text-sm leading-7 text-gray-700'><span class='text-pink-500'>•</span><span class='flex-1'>${text}</span></div>`;
            case 'number': {
                const match = block.text.match(/^(\d+)\.\s*(.*)$/);
                return `<div class='flex gap-3 mb-2 text-sm leading-7 text-gray-700'><span class='shrink-0 h-6 w-6 rounded-full bg-rose-100 text-pink-600 text-xs font-bold flex items-center justify-center'>${escapeHtml(match?.[1] ?? '')}</span><span class='flex-1'>${escapeHtml(match?.[2] ?? block.text)}</span></div>`;
            }
            case 'note':
                return `<div class='mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3'><p class='text-xs font-bold uppercase text-amber-700 mb-1'>Nota</p><p class='text-sm leading-7 text-amber-900'>${text}</p></div>`;
            case 'image': {
                const src = `/${block.file.replace(/^public\//, '')}`;
                return `<figure class='my-4 text-center'><img class='mx-auto h-auto w-28' src='${escapeHtml(src)}' alt='${escapeHtml(block.caption)}' /><figcaption class='text-xs text-gray-500 mt-2'>${escapeHtml(block.caption)}</figcaption></figure>`;
            }
            case 'subsection':
                return `<div class='mb-4 rounded-xl bg-gray-50 p-4'><h4 class='text-sm font-bold text-gray-900 mb-2'>${escapeHtml(block.title)}</h4>${block.blocks.map(renderBlock).join('')}</div>`;
            default:
                return '';
        }
    };

    const getVisibleSections = () => {
        const search = normalize(query);
        if (!search) return sections;
        return sections.reduce((acc, section) => {
            if (normalize(section.title).includes(search)) {
                acc.push(section);
                return acc;
            }
            const blocks = filterBlocks(section.blocks, search);
            if (blocks.length > 0) acc.push({ ...section, blocks });
            return acc;
        }, []);
    };

    const render = () => {
        const search = normalize(query);
        const visibleSections = getVisibleSections();
        const allExpanded = visibleSections.length > 0 && visibleSections.every((section) => expanded.has(section.id));

        mount.innerHTML = `
            <div class='bg-white rounded-2xl shadow-md border border-gray-100 p-4 md:p-6'>
                <div class='mb-4'>
                    <div class='relative'>
                        <span class='material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' data-ico='search'></span>
                        <input
                            id='manual-search'
                            type='search'
                            value='${escapeHtml(query)}'
                            placeholder='Buscar en el manual...'
                            aria-label='Buscar en el manual'
                            class='w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none focus:border-pink-400 focus:bg-white'
                        />
                    </div>
                    <p class='text-xs text-gray-500 mt-2' data-manual-status>
                        ${search ? `${visibleSections.length} seccion(es) coinciden con “${escapeHtml(query)}”` : 'Toca una sección para expandirla y consultar el contenido.'}
                    </p>
                </div>

                ${
                    search
                        ? ''
                        : `<div class='flex flex-wrap items-center gap-2 mb-4'>
                            <button type='button' data-manual-toggle-all class='rounded-full border border-pink-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-pink-600 hover:bg-rose-100 transition'>
                                ${allExpanded ? 'Contraer todo' : 'Expandir todo'}
                            </button>
                            ${sections
                                .map(
                                    (section) =>
                                        `<button type='button' data-manual-toc='${escapeHtml(section.id)}' class='rounded-full bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-rose-100 hover:text-pink-600 transition'>${escapeHtml(section.title)}</button>`
                                )
                                .join('')}
                        </div>`
                }

                ${manualContent.intro.map(renderBlock).join('')}

                <div class='grid gap-3'>
                    ${visibleSections
                        .map(
                            (section) => `
                        <details data-manual-section='${escapeHtml(section.id)}' class='group rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden' ${search || expanded.has(section.id) ? 'open' : ''}>
                            <summary class='flex cursor-pointer list-none items-center justify-between gap-3 p-4'>
                                <span class='flex items-center gap-3'>
                                    <span data-manual-chevron class='text-pink-500 text-lg leading-none'>${search || expanded.has(section.id) ? '▾' : '▸'}</span>
                                    <span class='font-semibold text-gray-900'>${escapeHtml(section.title)}</span>
                                </span>
                                <span class='text-xs text-gray-400'>${section.blocks.length}</span>
                            </summary>
                            <div class='border-t border-gray-100 p-4 bg-rose-50/40'>${section.blocks.map(renderBlock).join('')}</div>
                        </details>`
                        )
                        .join('')}

                    ${
                        visibleSections.length === 0
                            ? `<div class='rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500'>No se encontraron resultados. Prueba con otro término.</div>`
                            : ''
                    }
                </div>
            </div>`;

        const input = mount.querySelector('#manual-search');
        input.addEventListener('input', (event) => {
            query = event.target.value;
            render();
            const nextInput = mount.querySelector('#manual-search');
            nextInput.focus();
            nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        });

        mount.querySelectorAll('[data-manual-section]').forEach((details) => {
            const chevron = details.querySelector('[data-manual-chevron]');
            const id = details.dataset.manualSection;
            details.addEventListener('toggle', () => {
                chevron.textContent = details.open ? '▾' : '▸';
                if (details.open) expanded.add(id);
                else expanded.delete(id);
            });
        });

        const toggleAll = mount.querySelector('[data-manual-toggle-all]');
        if (toggleAll) {
            toggleAll.addEventListener('click', () => {
                if (allExpanded) expanded.clear();
                else sections.forEach((section) => expanded.add(section.id));
                query = '';
                render();
            });
        }

        mount.querySelectorAll('[data-manual-toc]').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.dataset.manualToc;
                query = '';
                expanded.add(id);
                render();
                requestAnimationFrame(() => {
                    mount
                        .querySelector(`[data-manual-section='${id}']`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
        });
    };

    render();
}
