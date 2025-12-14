import React, { createContext, useContext } from "react";
import { db } from "../config/firebase";
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    orderBy,
    query,
    writeBatch,
} from "firebase/firestore";

const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {

    // --------------------------
    // PROJECTS
    // --------------------------
    const getProjects = async () => {
        const colRef = collection(db, "projects");
        const snap = await getDocs(colRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const createProject = async (data) => {
        return addDoc(collection(db, "projects"), {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const updateProject = async (projectId, data) => {
        const ref = doc(db, "projects", projectId);
        return updateDoc(ref, { ...data, updatedAt: new Date() });
    };

    const deleteProject = async (projectId) => {
        return deleteDoc(doc(db, "projects", projectId));
    };

    // --------------------------
    // CHAPTERS
    // --------------------------
    const getChapters = async (projectId) => {
        const qRef = query(
            collection(db, "projects", projectId, "chapters"),
            orderBy("orderIndex", "asc")
        );
        const snap = await getDocs(qRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const createChapter = async (projectId, data) => {
        return addDoc(collection(db, "projects", projectId, "chapters"), {
            orderIndex: data.orderIndex ?? Date.now(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        });
    };

    const updateChapter = async (projectId, chapterId, data) => {
        const ref = doc(db, "projects", projectId, "chapters", chapterId);
        return updateDoc(ref, { ...data, updatedAt: new Date() });
    };

    // --------------------------
    // BEATS
    // --------------------------
    const getBeats = async (projectId, chapterId) => {
        const qRef = query(
            collection(db, "projects", projectId, "chapters", chapterId, "beats"),
            orderBy("orderIndex", "asc")
        );
        const snap = await getDocs(qRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    const updateBeat = async (projectId, chapterId, beatId, data) => {
        const ref = doc(db, "projects", projectId, "chapters", chapterId, "beats", beatId);
        return updateDoc(ref, { ...data, updatedAt: new Date() });
    };

    const createBeat = async (projectId, chapterId, data) => {
        return addDoc(collection(db, "projects", projectId, "chapters", chapterId, "beats"), {
            orderIndex: data.orderIndex ?? Date.now(),
            linkedSceneId: data.linkedSceneId || null, // NEW: Track which scene this beat is linked to
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        });
    };

    const deleteBeat = async (projectId, chapterId, beatId) => {
        const ref = doc(db, "projects", projectId, "chapters", chapterId, "beats", beatId);
        return deleteDoc(ref);
    };

    // --------------------------
    // SCENES
    // --------------------------
    const getScenes = async (projectId, chapterId) => {
        const qRef = query(
            collection(db, "projects", projectId, "chapters", chapterId, "scenes"),
            orderBy("orderIndex", "asc")
        );
        const snap = await getDocs(qRef);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    };

    const createScene = async (projectId, chapterId, data) => {
        return addDoc(
            collection(db, "projects", projectId, "chapters", chapterId, "scenes"),
            {
                orderIndex: data.orderIndex ?? Date.now(),
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data,
            }
        );
    };

    const updateScene = async (projectId, chapterId, sceneId, data) => {
        const ref = doc(
            db,
            "projects",
            projectId,
            "chapters",
            chapterId,
            "scenes",
            sceneId
        );
        return updateDoc(ref, { ...data, updatedAt: new Date() });
    };

    const deleteScene = async (projectId, chapterId, sceneId) => {
        const ref = doc(
            db,
            "projects",
            projectId,
            "chapters",
            chapterId,
            "scenes",
            sceneId
        );
        return deleteDoc(ref);
    };

    // --------------------------
    // MANUSCRIPT COMMENTS
    // --------------------------
    const getComments = async (projectId, chapterId) => {
        const qRef = query(
            collection(db, "projects", projectId, "chapters", chapterId, "comments"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(qRef);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    };

    const createComment = async (projectId, chapterId, data) => {
        return addDoc(
            collection(db, "projects", projectId, "chapters", chapterId, "comments"),
            {
                ...data,
                createdAt: new Date(),
            }
        );
    };

    const deleteComment = async (projectId, chapterId, commentId) => {
        const ref = doc(
            db,
            "projects",
            projectId,
            "chapters",
            chapterId,
            "comments",
            commentId
        );
        return deleteDoc(ref);
    };

    // --------------------------
    // MANUSCRIPT HIGHLIGHTS
    // --------------------------
    const getHighlights = async (projectId, chapterId) => {
        const qRef = query(
            collection(db, "projects", projectId, "chapters", chapterId, "highlights"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(qRef);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    };

    const createHighlight = async (projectId, chapterId, data) => {
        return addDoc(
            collection(db, "projects", projectId, "chapters", chapterId, "highlights"),
            {
                ...data,
                createdAt: new Date(),
            }
        );
    };

    const deleteHighlight = async (projectId, chapterId, highlightId) => {
        const ref = doc(
            db,
            "projects",
            projectId,
            "chapters",
            chapterId,
            "highlights",
            highlightId
        );
        return deleteDoc(ref);
    };

    // --------------------------
    // NEW: BEAT-SCENE LINKING
    // --------------------------
    
    /**
     * Link a beat to a scene
     */
    const linkBeatToScene = async (projectId, chapterId, beatId, sceneId) => {
        const ref = doc(db, "projects", projectId, "chapters", chapterId, "beats", beatId);
        return updateDoc(ref, { 
            linkedSceneId: sceneId,
            updatedAt: new Date() 
        });
    };

    /**
     * Unlink a beat from its scene
     */
    const unlinkBeat = async (projectId, chapterId, beatId) => {
        const ref = doc(db, "projects", projectId, "chapters", chapterId, "beats", beatId);
        return updateDoc(ref, { 
            linkedSceneId: null,
            updatedAt: new Date() 
        });
    };

    /**
     * Reorder scenes and update linked beats accordingly
     * This ensures beats stay synchronized with their linked scenes
     */
    const reorderScenesWithBeats = async (projectId, chapterId, reorderedScenes, beats) => {
        const batch = writeBatch(db);

        // Update scene order
        reorderedScenes.forEach((scene, index) => {
            const sceneRef = doc(db, "projects", projectId, "chapters", chapterId, "scenes", scene.id);
            batch.update(sceneRef, { orderIndex: index, updatedAt: new Date() });
        });

        // Update beat order based on linked scenes
        const linkedBeats = beats.filter(b => b.linkedSceneId);
        linkedBeats.forEach(beat => {
            const linkedSceneIndex = reorderedScenes.findIndex(s => s.id === beat.linkedSceneId);
            if (linkedSceneIndex !== -1) {
                const beatRef = doc(db, "projects", projectId, "chapters", chapterId, "beats", beat.id);
                batch.update(beatRef, { 
                    orderIndex: linkedSceneIndex,
                    updatedAt: new Date() 
                });
            }
        });

        // Unlinked beats keep their current order at the end
        const unlinkedBeats = beats.filter(b => !b.linkedSceneId);
        unlinkedBeats.forEach((beat, index) => {
            const beatRef = doc(db, "projects", projectId, "chapters", chapterId, "beats", beat.id);
            batch.update(beatRef, { 
                orderIndex: reorderedScenes.length + index,
                updatedAt: new Date() 
            });
        });

        return batch.commit();
    };


    return (
        <FirestoreContext.Provider value={{
            getProjects,
            createProject,
            updateProject,
            deleteProject,

            getChapters,
            createChapter,
            updateChapter,

            getBeats,
            createBeat,
            updateBeat,
            deleteBeat,

            getScenes,
            createScene,
            updateScene,
            deleteScene,

            // Beat-Scene linking functions
            linkBeatToScene,
            unlinkBeat,
            reorderScenesWithBeats,

            // Manuscript comments and highlights
            getComments,
            createComment,
            deleteComment,
            getHighlights,
            createHighlight,
            deleteHighlight,
        }}>
            {children}
        </FirestoreContext.Provider>
    );
}