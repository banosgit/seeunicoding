import { useRef, useState } from 'react';
import { LessonView, getImage } from '@seeuni/renderer';
import { BLOCK_TYPES, newBlock, newLesson, validateLesson } from '@seeuni/schema';
import ImagePicker from './ImagePicker.jsx';
import config from '../../../content/categories.json';

const LABEL = { heading: '제목', paragraph: '문단', code: '코드 예제', output: '예상 출력', image: '이미지' };
const FILE_TYPES = [{ description: '강의 JSON', accept: { 'application/json': ['.json'] } }];
const hasFS = 'showOpenFilePicker' in window;
const byOrder = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9);
const LANGS = [...(config.languages ?? [])].sort(byOrder);
const catsOf = (lang) => (config.categories ?? []).filter((c) => c.lang === lang).sort(byOrder);

export default function App() {
  const [lesson, setLesson] = useState(newLesson);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState('');
  const [trash, setTrash] = useState([]);
  const [showIdTip, setShowIdTip] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [picker, setPicker] = useState(null);
  const handle = useRef(null);
  const confirmed = useRef(false);

  const setField = (k, v) => setLesson((l) => ({ ...l, [k]: v }));
  const setLang = (lang) =>
    setLesson((l) => {
      const cats = catsOf(lang);
      const keep = cats.some((c) => c.id === l.category);
      return { ...l, lang, category: keep ? l.category : cats[0]?.id ?? l.category };
    });
  const patchBlock = (id, patch) =>
    setLesson((l) => ({ ...l, blocks: l.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
  const addImage = (imageId) => {
    const nb = newBlock('image', { imageId });
    setLesson((l) => ({ ...l, blocks: [...l.blocks, nb] }));
    setSelectedId(nb.id);
  };
  const edit = { selectedId, onSelect: setSelectedId, onChange: patchBlock };
  const setBlock = (i, patch) =>
    setLesson((l) => ({ ...l, blocks: l.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));
  const addBlock = (t) => setLesson((l) => ({ ...l, blocks: [...l.blocks, newBlock(t)] }));
  const dupBlock = (i) =>
    setLesson((l) => {
      const a = [...l.blocks];
      a.splice(i + 1, 0, { ...a[i], id: newBlock(a[i].type).id });
      return { ...l, blocks: a };
    });
  const removeBlock = (i) => {
    const b = lesson.blocks[i];
    setTrash((t) => [...t, { block: b, index: i }]);
    setLesson((l) => ({ ...l, blocks: l.blocks.filter((_, j) => j !== i) }));
  };
  const undo = () => {
    const last = trash[trash.length - 1];
    if (!last) return;
    setTrash((t) => t.slice(0, -1));
    setLesson((l) => {
      const a = [...l.blocks];
      a.splice(Math.min(last.index, a.length), 0, last.block);
      return { ...l, blocks: a };
    });
  };
  const move = (i, d) =>
    setLesson((l) => {
      const a = [...l.blocks];
      const j = i + d;
      if (j < 0 || j >= a.length) return l;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...l, blocks: a };
    });

  function newFile() {
    if (!confirm('현재 내용이 사라집니다. 새로 만들까요?')) return;
    setLesson(newLesson());
    setTrash([]);
    setSelectedId(null);
    handle.current = null;
    confirmed.current = false;
    setErrors([]);
    setStatus('새 강의');
  }

  async function openFile() {
    if (!hasFS) return alert('크롬 또는 엣지에서 실행해 주세요.');
    try {
      const [h] = await window.showOpenFilePicker({ types: FILE_TYPES });
      const text = await (await h.getFile()).text();
      let data;
      try { data = JSON.parse(text); }
      catch (e) { setErrors([`${h.name}: JSON 형식 오류 - ${e.message}`]); return; }
      const errs = validateLesson(data);
      if (errs.length) { setErrors(errs.map((e) => `${h.name}: ${e}`)); return; }
      setLesson(data);
      setTrash([]);
      setSelectedId(null);
      handle.current = h;
      confirmed.current = false;
      setErrors([]);
      const legacy = data.blocks.some((b) => b.type === 'image' && !b.anchor);
      setStatus(legacy ? `${h.name} 열기 완료 · 이미지 위치를 휴대폰에서도 맞도록 바꿨어요. 저장해 주세요.` : `${h.name} 열기 완료`);
    } catch (e) { if (e.name !== 'AbortError') setErrors([String(e)]); }
  }

  async function save(saveAs) {
    if (!hasFS) return alert('크롬 또는 엣지에서 실행해 주세요.');
    const imgErrs = lesson.blocks.flatMap((b, i) =>
      b.type === 'image' && !getImage(b.imageId) ? [`블록 ${i + 1}: 이미지 라이브러리에 없는 이미지입니다. (${b.imageId})`] : []);
    const errs = [...validateLesson(lesson), ...imgErrs];
    if (errs.length) { setErrors(errs); setStatus(''); return; }
    setErrors([]);
    try {
      if (saveAs || !handle.current) {
        handle.current = await window.showSaveFilePicker({ suggestedName: `${lesson.id}.json`, types: FILE_TYPES });
        confirmed.current = true;
      } else if (!confirmed.current) {
        if (!confirm(`${handle.current.name} 파일을 덮어쓸까요?`)) return;
        confirmed.current = true;
      }
      const w = await handle.current.createWritable();
      await w.write(JSON.stringify(lesson, null, 2) + '\n');
      await w.close();
      setStatus(`${handle.current.name} 저장 완료`);
    } catch (e) { if (e.name !== 'AbortError') setErrors([String(e)]); }
  }

  return (
    <div className="app">
      <header className="bar">
        <strong>SeeUNI 강의 에디터</strong>
        <div className="btns">
          <button onClick={newFile}>새로 만들기</button>
          <button onClick={openFile}>열기</button>
          <button className="primary" onClick={() => save(false)}>저장</button>
          <button onClick={() => save(true)}>다른 이름으로 저장</button>
          <button onClick={undo} disabled={trash.length === 0}>되돌리기{trash.length > 0 ? ` (${trash.length})` : ''}</button>
        </div>
        <span className="status" role="status">{status}</span>
      </header>

      {errors.length > 0 && (
        <ul className="errors" role="alert">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}

      <div className="cols">
        <section className="pane" aria-label="편집">
          <div className="meta">
            <div className="field">
              <div className="lab">
                <label htmlFor="f-id">강의 ID</label>
                <button
                  type="button"
                  className="info"
                  aria-label="강의 ID 형식 안내"
                  aria-expanded={showIdTip}
                  aria-controls="id-tip"
                  onClick={() => setShowIdTip((v) => !v)}
                >i</button>
              </div>
              <input id="f-id" value={lesson.id} onChange={(e) => setField('id', e.target.value)} />
            </div>
            <label>제목<input value={lesson.title} onChange={(e) => setField('title', e.target.value)} /></label>
            <label>언어
              <select value={lesson.lang} onChange={(e) => setLang(e.target.value)}>
                {!LANGS.some((l) => l.id === lesson.lang) && <option value={lesson.lang}>{lesson.lang} (설정에 없음)</option>}
                {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label>카테고리
              <select value={lesson.category} onChange={(e) => setField('category', e.target.value)}>
                {!catsOf(lesson.lang).some((c) => c.id === lesson.category) && <option value={lesson.category}>{lesson.category} (설정에 없음)</option>}
                {catsOf(lesson.lang).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {showIdTip && (
              <ul className="tip" id="id-tip">
                <li>형식: 소문자 영문 약자 + 하이픈(-) + 숫자 4자리</li>
                <li>예시: py-0001, py-0002, js-0001</li>
                <li>다른 강의와 겹치면 안 돼요. (저장 파일명 기본값도 py-0001.json처럼 ID를 써요)</li>
                <li>강의 주소와 연결되는 값이라 한 번 정하면 바꾸지 마세요. 제목은 나중에 바꿔도 괜찮아요.</li>
              </ul>
            )}
          </div>

          {lesson.blocks.map((b, i) => (
            <div className={'block' + (selectedId === b.id ? ' sel' : '')} key={b.id} onClick={() => setSelectedId(b.type === 'image' ? b.id : null)}>
              <div className="block-head">
                <strong>{i + 1}. {LABEL[b.type]}</strong>
                <span>
                  <button onClick={() => move(i, -1)} aria-label="위로">↑</button>
                  <button onClick={() => move(i, 1)} aria-label="아래로">↓</button>
                  <button onClick={() => dupBlock(i)}>복제</button>
                  <button onClick={() => removeBlock(i)}>삭제</button>
                </span>
              </div>
              {b.type === 'heading' && (
                <div className="row">
                  <select value={b.level} onChange={(e) => setBlock(i, { level: Number(e.target.value) })}>
                    <option value={2}>큰 제목</option>
                    <option value={3}>작은 제목</option>
                  </select>
                  <input value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} placeholder="제목" />
                </div>
              )}
              {b.type === 'paragraph' && (
                <>
                  <div className="md-row">
                    <button
                      type="button"
                      className="toggle"
                      aria-pressed={!!b.markdown}
                      onClick={() => setBlock(i, { markdown: !b.markdown })}
                    >Markdown</button>
                    <span className="hint">{b.markdown ? '마크다운으로 표시 중' : '일반 글로 표시 중'}</span>
                  </div>
                  <textarea rows={4} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} placeholder={b.markdown ? '마크다운으로 작성 (예: **굵게**, - 목록)' : '본문'} />
                </>
              )}
              {b.type === 'code' && (
                <>
                  <input value={b.language} onChange={(e) => setBlock(i, { language: e.target.value })} placeholder="언어 (python)" />
                  <textarea className="mono" rows={6} value={b.code} onChange={(e) => setBlock(i, { code: e.target.value })} placeholder="코드" />
                </>
              )}
              {b.type === 'output' && (
                <textarea className="mono" rows={3} value={b.text} onChange={(e) => setBlock(i, { text: e.target.value })} placeholder="예상 출력" />
              )}
              {b.type === 'image' && (
                <div className="img-card">
                  {getImage(b.imageId)?.url ? <img src={getImage(b.imageId).url} alt="" /> : <span className="noimg">없음</span>}
                  <div className="img-info">
                    <div><strong>{b.imageId}</strong> <span className="hint">{getImage(b.imageId)?.alt}</span></div>
                    <div className="row2">
                      <button onClick={() => setPicker({ onPick: (id) => patchBlock(b.id, { imageId: id }) })}>이미지 바꾸기</button>
                    </div>
                    <p className="hint">오른쪽 미리보기에서 이미지를 끌어 이동하고, 모서리를 끌어 크기를 조절해요. 이미지는 항상 글 뒤에 놓이고, 겹치면 글이 위에 보여요. (선택 후 방향키로 이동, +/- 로 크기. 이미지끼리 겹치면 아래쪽 블록이 위에 올라와요)</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="add">
            <span>블록 추가</span>
            {BLOCK_TYPES.map((t) => (
              <button key={t} onClick={() => (t === 'image' ? setPicker({ onPick: addImage }) : addBlock(t))}>+ {LABEL[t]}</button>
            ))}
          </div>
        </section>

        <section className="pane preview" aria-label="미리보기">
          <LessonView lesson={lesson} edit={edit} />
        </section>
      </div>
      {picker && (
        <ImagePicker
          onPick={(id) => { picker.onPick(id); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
