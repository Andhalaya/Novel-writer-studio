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
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        });
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

            getScenes,
            createScene,
            updateScene,
            deleteScene,

        }}>
            {children}
        </FirestoreContext.Provider>
    );
}
