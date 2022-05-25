/*
 * @Author: pangff
 * @Date: 2022-05-16 13:45:41
 * @LastEditTime: 2022-05-18 10:10:14
 * @LastEditors: pangff
 * @Description: 
 * @FilePath: /noco-next-demo/src/__tests__/ms-start.test.ts
 * stay hungry,stay foolish
 */
import {  MockServer } from '@nocobase/test';
import { Plugin } from '@nocobase/server';

describe('application life cycle', () => {
    it('should start application', async () => {
      const app = new MockServer({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
  
      const loadFn = jest.fn();
      const installFn = jest.fn();
  
      // register plugin
      class TestPlugin extends Plugin {
        beforeLoad() {}
  
        getName() {
          return 'Test';
        }
  
        async load() {
          loadFn();
          this.app.on('beforeInstall', () => {
            installFn();
          });
        }
      }
      app.plugin(TestPlugin);
      await app.load();
      
      expect(loadFn).toHaveBeenCalledTimes(1);
      expect(installFn).toHaveBeenCalledTimes(0);
      await app.install();
      expect(app.listenServer).not.toBeNull();
      expect(installFn).toHaveBeenCalledTimes(1);
     
    });
  
    it('should listen application', async () => {
      const app = new MockServer({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
      expect(app.listenServer).not.toBeNull();
   

      await app.start({ listen: { port: 13090 } });
      expect(app.listenServer).not.toBeNull();
  
      await app.stop();
      expect(app.listenServer).toBeNull();
    });

    
  });


  